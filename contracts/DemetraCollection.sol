// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DemetraCollection is ERC721, ERC721Holder, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant DEFAULT_NFT_PRICE = 0.01 ether;

    struct Collection {
        string name;
        string baseURI;
        uint256 maxSupply;
        uint256 minted;
        uint256 price;
        bool exists;
    }

    uint256 public nextCollectionId = 1;
    uint256 public nextTokenId = 1;
    uint256 public proceeds;

    mapping(address => bool) public admins;
    mapping(uint256 => Collection) private collections;
    mapping(uint256 => uint256) public tokenToCollection;
    mapping(uint256 => uint256) public tokenSalePrice;

    event AdminUpdated(address indexed account, bool approved);
    event CollectionCreated(uint256 indexed collectionId, string name, uint256 maxSupply, uint256 price);
    event CollectionBaseURIUpdated(uint256 indexed collectionId, string newBaseURI);
    event CollectionPriceUpdated(uint256 indexed collectionId, uint256 newPrice);
    event TokenMinted(uint256 indexed collectionId, uint256 indexed tokenId, address indexed to);
    event TokenPriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    event NFTPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ProceedsWithdrawn(address indexed receiver, uint256 amount);

    modifier onlyAdmin() {
        require(owner() == msg.sender || admins[msg.sender], "Not Demetra admin");
        _;
    }

    constructor(address initialOwner) ERC721("Demetra NFT", "DMTR") Ownable(initialOwner) {}

    function setAdmin(address account, bool approved) external onlyOwner {
        admins[account] = approved;
        emit AdminUpdated(account, approved);
    }

    function createCollection(
        string calldata name,
        string calldata baseURI,
        uint256 maxSupply
    ) external onlyAdmin returns (uint256 collectionId) {
        require(bytes(name).length > 0, "Collection name required");
        require(bytes(baseURI).length > 0, "Base URI required");
        require(maxSupply > 0, "Max supply must be positive");

        collectionId = nextCollectionId;
        nextCollectionId += 1;

        collections[collectionId] = Collection({
            name: name,
            baseURI: baseURI,
            maxSupply: maxSupply,
            minted: 0,
            price: DEFAULT_NFT_PRICE,
            exists: true
        });

        emit CollectionCreated(collectionId, name, maxSupply, DEFAULT_NFT_PRICE);
    }

    function setCollectionPrice(uint256 collectionId, uint256 newPrice) external onlyAdmin {
        Collection storage collection = collections[collectionId];

        require(collection.exists, "Collection not found");
        require(newPrice > 0, "Price must be positive");

        collection.price = newPrice;
        emit CollectionPriceUpdated(collectionId, newPrice);
    }

    function setCollectionBaseURI(uint256 collectionId, string calldata newBaseURI) external onlyAdmin {
        Collection storage collection = collections[collectionId];

        require(collection.exists, "Collection not found");
        require(bytes(newBaseURI).length > 0, "Base URI required");

        collection.baseURI = newBaseURI;
        emit CollectionBaseURIUpdated(collectionId, newBaseURI);
    }

    function mintTo(address to, uint256 collectionId) external onlyAdmin returns (uint256 tokenId) {
        tokenId = _mintFromCollection(to, collectionId);
    }

    function mintToTreasury(uint256 collectionId) external onlyAdmin returns (uint256 tokenId) {
        tokenId = _mintFromCollection(address(this), collectionId);
        tokenSalePrice[tokenId] = collections[collectionId].price;
        emit TokenPriceUpdated(tokenId, tokenSalePrice[tokenId]);
    }

    function setTokenPrice(uint256 tokenId, uint256 newPrice) external onlyAdmin {
        require(_ownerOf(tokenId) != address(0), "Token not minted");
        require(ownerOf(tokenId) == address(this), "Token not in treasury");
        require(newPrice > 0, "Price must be positive");

        tokenSalePrice[tokenId] = newPrice;
        emit TokenPriceUpdated(tokenId, newPrice);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token not minted");
        require(ownerOf(tokenId) == address(this), "Token unavailable");

        uint256 price = tokenSalePrice[tokenId];
        require(price > 0, "Token not for sale");
        require(msg.value == price, "Incorrect ETH amount");

        proceeds += msg.value;
        tokenSalePrice[tokenId] = 0;

        _safeTransfer(address(this), msg.sender, tokenId, "");

        emit NFTPurchased(tokenId, msg.sender, msg.value);
    }

    function withdrawProceeds(address payable receiver) external onlyOwner nonReentrant {
        require(receiver != address(0), "Invalid receiver");
        require(proceeds > 0, "No proceeds available");

        uint256 amount = proceeds;
        proceeds = 0;

        (bool success, ) = receiver.call{value: amount}("");
        require(success, "Withdraw failed");

        emit ProceedsWithdrawn(receiver, amount);
    }

    function getCollection(
        uint256 collectionId
    )
        external
        view
        returns (string memory name, string memory baseURI, uint256 maxSupply, uint256 minted, uint256 price)
    {
        Collection storage collection = collections[collectionId];
        require(collection.exists, "Collection not found");

        return (collection.name, collection.baseURI, collection.maxSupply, collection.minted, collection.price);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");

        Collection storage collection = collections[tokenToCollection[tokenId]];
        return string.concat(collection.baseURI, tokenId.toString(), ".json");
    }

    function _mintFromCollection(address to, uint256 collectionId) internal returns (uint256 tokenId) {
        Collection storage collection = collections[collectionId];

        require(collection.exists, "Collection not found");
        require(collection.minted < collection.maxSupply, "Collection sold out");

        tokenId = nextTokenId;
        nextTokenId += 1;
        collection.minted += 1;

        tokenToCollection[tokenId] = collectionId;
        _safeMint(to, tokenId);

        emit TokenMinted(collectionId, tokenId, to);
    }
}

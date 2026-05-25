// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DemetraAuction is ERC721Holder, Ownable, ReentrancyGuard {
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 reservePrice;
        uint64 endTime;
        address highestBidder;
        uint256 highestBid;
        bool settled;
    }

    IERC721 public immutable demetraCollection;
    uint256 public nextAuctionId = 1;

    mapping(address => bool) public admins;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public pendingReturns;
    mapping(address => uint256) public proceeds;

    event AdminUpdated(address indexed account, bool approved);
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 reservePrice,
        uint64 endTime
    );
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningBid, bool sold);
    event RefundWithdrawn(address indexed bidder, uint256 amount);
    event ProceedsWithdrawn(address indexed seller, uint256 amount);

    modifier onlyAdmin() {
        require(owner() == msg.sender || admins[msg.sender], "Not Demetra admin");
        _;
    }

    constructor(address demetraCollectionAddress, address initialOwner) Ownable(initialOwner) {
        require(demetraCollectionAddress != address(0), "Invalid NFT address");
        demetraCollection = IERC721(demetraCollectionAddress);
    }

    function setAdmin(address account, bool approved) external onlyOwner {
        admins[account] = approved;
        emit AdminUpdated(account, approved);
    }

    function createAuction(
        uint256 tokenId,
        uint256 reservePrice,
        uint64 durationSeconds
    ) external onlyAdmin nonReentrant returns (uint256 auctionId) {
        require(durationSeconds > 0, "Duration must be positive");
        require(demetraCollection.ownerOf(tokenId) == msg.sender, "Admin not token owner");

        bool isApproved = demetraCollection.getApproved(tokenId) == address(this)
            || demetraCollection.isApprovedForAll(msg.sender, address(this));
        require(isApproved, "Auction not approved");

        demetraCollection.safeTransferFrom(msg.sender, address(this), tokenId);

        auctionId = nextAuctionId;
        nextAuctionId += 1;

        auctions[auctionId] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            reservePrice: reservePrice,
            endTime: uint64(block.timestamp + durationSeconds),
            highestBidder: address(0),
            highestBid: 0,
            settled: false
        });

        emit AuctionCreated(auctionId, msg.sender, tokenId, reservePrice, uint64(block.timestamp + durationSeconds));
    }

    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(auction.seller != address(0), "Auction not found");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.reservePrice, "Bid below reserve");
        require(msg.value > auction.highestBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function claimAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(auction.seller != address(0), "Auction not found");
        require(block.timestamp >= auction.endTime, "Auction still active");
        require(!auction.settled, "Auction already settled");

        auction.settled = true;

        if (auction.highestBidder == address(0)) {
            require(
                msg.sender == auction.seller || msg.sender == owner() || admins[msg.sender],
                "Not authorized to recover"
            );

            demetraCollection.safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(auctionId, address(0), 0, false);
            return;
        }

        require(
            msg.sender == auction.highestBidder || msg.sender == auction.seller || msg.sender == owner() || admins[msg.sender],
            "Not authorized to claim"
        );

        proceeds[auction.seller] += auction.highestBid;
        demetraCollection.safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

        emit AuctionSettled(auctionId, auction.highestBidder, auction.highestBid, true);
    }

    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No refund available");

        pendingReturns[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit RefundWithdrawn(msg.sender, amount);
    }

    function withdrawProceeds() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        require(amount > 0, "No proceeds available");

        proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Proceeds transfer failed");

        emit ProceedsWithdrawn(msg.sender, amount);
    }
}

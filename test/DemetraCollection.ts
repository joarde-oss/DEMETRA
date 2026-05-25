import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("DemetraCollection", async function () {
  const { ethers } = await network.create();

  async function deployFixture() {
    const [owner, admin, buyer, otherUser] = await ethers.getSigners();
    const collection = await ethers.deployContract("DemetraCollection", [owner.address]);

    return { collection, owner, admin, buyer, otherUser };
  }

  async function expectRevert(action: Promise<unknown>, message: string) {
    try {
      await action;
      assert.fail(`Expected revert with message: ${message}`);
    } catch (error) {
      assert.match(String(error), new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  }

  it("stores the contract owner", async function () {
    const { collection, owner } = await deployFixture();
    assert.equal(await collection.owner(), owner.address);
  });

  it("lets a Demetra admin create a new NFT collection", async function () {
    const { collection, owner, admin } = await deployFixture();

    await expectRevert(
      collection.connect(admin).createCollection("Genesis", "ipfs://genesis/", 3),
      "Not Demetra admin"
    );

    await collection.connect(owner).setAdmin(admin.address, true);
    await collection.connect(admin).createCollection("Genesis", "ipfs://genesis/", 3);

    const createdCollection = await collection.getCollection(1);
    assert.equal(createdCollection[0], "Genesis");
    assert.equal(createdCollection[1], "ipfs://genesis/");
    assert.equal(createdCollection[2], 3n);
    assert.equal(createdCollection[3], 0n);
    assert.equal(createdCollection[4], ethers.parseEther("0.01"));
  });

  it("lets the admin update the collection base URI", async function () {
    const { collection, owner } = await deployFixture();

    await collection.connect(owner).createCollection("Genesis", "ipfs://genesis/", 3);
    await collection.connect(owner).setCollectionBaseURI(1, "https://demetra.example/metadata/");

    const updatedCollection = await collection.getCollection(1);
    assert.equal(updatedCollection[1], "https://demetra.example/metadata/");
  });

  it("lets the admin set the NFT price and allows a user to buy it", async function () {
    const { collection, owner, buyer } = await deployFixture();

    await collection.connect(owner).createCollection("Genesis", "ipfs://genesis/", 5);
    await collection.connect(owner).mintToTreasury(1);

    assert.equal(await collection.tokenSalePrice(1), ethers.parseEther("0.01"));

    await collection.connect(owner).setTokenPrice(1, ethers.parseEther("0.02"));
    assert.equal(await collection.tokenSalePrice(1), ethers.parseEther("0.02"));

    await expectRevert(
      collection.connect(buyer).buyNFT(1, { value: ethers.parseEther("0.01") }),
      "Incorrect ETH amount"
    );

    await collection.connect(owner).setTokenPrice(1, ethers.parseEther("0.01"));
    await collection.connect(buyer).buyNFT(1, { value: ethers.parseEther("0.01") });

    assert.equal(await collection.ownerOf(1), buyer.address);
    assert.equal(await collection.proceeds(), ethers.parseEther("0.01"));
  });

  it("lets holders transfer NFTs to another user", async function () {
    const { collection, owner, buyer, otherUser } = await deployFixture();

    await collection.connect(owner).createCollection("Genesis", "ipfs://genesis/", 5);
    await collection.connect(owner).mintToTreasury(1);
    await collection.connect(buyer).buyNFT(1, { value: ethers.parseEther("0.01") });
    await collection.connect(buyer).transferFrom(buyer.address, otherUser.address, 1);

    assert.equal(await collection.ownerOf(1), otherUser.address);
  });

  it("lets the owner withdraw the proceeds", async function () {
    const { collection, owner, buyer } = await deployFixture();

    await collection.connect(owner).createCollection("Genesis", "ipfs://genesis/", 5);
    await collection.connect(owner).mintToTreasury(1);
    await collection.connect(buyer).buyNFT(1, { value: ethers.parseEther("0.01") });

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await collection.connect(owner).withdrawProceeds(owner.address);
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    assert.equal(await collection.proceeds(), 0n);
    assert.equal(ownerBalanceAfter, ownerBalanceBefore + ethers.parseEther("0.01") - gasCost);
  });
});

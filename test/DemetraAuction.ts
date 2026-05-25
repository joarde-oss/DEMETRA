import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("DemetraAuction", async function () {
  const { ethers } = await network.create();

  async function deployFixture() {
    const [owner, bidderOne, bidderTwo] = await ethers.getSigners();
    const collection = await ethers.deployContract("DemetraCollection", [owner.address]);
    const auction = await ethers.deployContract("DemetraAuction", [await collection.getAddress(), owner.address]);

    await collection.connect(owner).createCollection("Genesis", "ipfs://genesis/", 10);

    return { collection, auction, owner, bidderOne, bidderTwo };
  }

  it("lets a Demetra admin create an auction", async function () {
    const { collection, auction, owner } = await deployFixture();

    await collection.connect(owner).mintTo(owner.address, 1);
    await collection.connect(owner).approve(await auction.getAddress(), 1);
    await auction.connect(owner).createAuction(1, ethers.parseEther("0.01"), 3600);

    const createdAuction = await auction.auctions(1);
    assert.equal(createdAuction.seller, owner.address);
    assert.equal(createdAuction.tokenId, 1n);
    assert.equal(await collection.ownerOf(1), await auction.getAddress());
  });

  it("handles bids, winner claim, and loser refunds", async function () {
    const { collection, auction, owner, bidderOne, bidderTwo } = await deployFixture();

    await collection.connect(owner).mintTo(owner.address, 1);
    await collection.connect(owner).approve(await auction.getAddress(), 1);
    await auction.connect(owner).createAuction(1, ethers.parseEther("0.01"), 3600);

    await auction.connect(bidderOne).placeBid(1, { value: ethers.parseEther("0.01") });
    await auction.connect(bidderTwo).placeBid(1, { value: ethers.parseEther("0.02") });

    assert.equal(await auction.pendingReturns(bidderOne.address), ethers.parseEther("0.01"));

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await auction.connect(bidderTwo).claimAuction(1);

    assert.equal(await collection.ownerOf(1), bidderTwo.address);
    assert.equal(await auction.proceeds(owner.address), ethers.parseEther("0.02"));

    const bidderOneBalanceBefore = await ethers.provider.getBalance(bidderOne.address);
    const refundTx = await auction.connect(bidderOne).withdrawRefund();
    const refundReceipt = await refundTx.wait();
    const refundGasCost = refundReceipt!.gasUsed * refundReceipt!.gasPrice;
    const bidderOneBalanceAfter = await ethers.provider.getBalance(bidderOne.address);

    assert.equal(await auction.pendingReturns(bidderOne.address), 0n);
    assert.equal(bidderOneBalanceAfter, bidderOneBalanceBefore + ethers.parseEther("0.01") - refundGasCost);
  });

  it("returns the NFT to the seller if the auction ends with no bids", async function () {
    const { collection, auction, owner } = await deployFixture();

    await collection.connect(owner).mintTo(owner.address, 1);
    await collection.connect(owner).approve(await auction.getAddress(), 1);
    await auction.connect(owner).createAuction(1, ethers.parseEther("0.01"), 120);

    await ethers.provider.send("evm_increaseTime", [121]);
    await ethers.provider.send("evm_mine", []);

    await auction.connect(owner).claimAuction(1);

    assert.equal(await collection.ownerOf(1), owner.address);
  });
});

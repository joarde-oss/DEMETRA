import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.create('sepolia');
  const metadataBaseURI = process.env.NFT_METADATA_BASE_URI ?? 'http://localhost:3000/metadata/';
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  const collectionFactory = await ethers.getContractFactory('DemetraCollection');
  const auctionFactory = await ethers.getContractFactory('DemetraAuction');
  const collection = await collectionFactory.deploy(deployer.address, {
    gasLimit: 4_500_000n
  });

  await collection.waitForDeployment();

  const collectionAddress = await collection.getAddress();
  const auction = await auctionFactory.deploy(collectionAddress, deployer.address, {
    gasLimit: 3_500_000n
  });
  await auction.waitForDeployment();

  const createCollectionTx = await collection.createCollection('Demetra Genesis', metadataBaseURI, 6, {
    gasLimit: 600_000n
  });
  await createCollectionTx.wait();

  for (let index = 0; index < 6; index += 1) {
    const mintTx = await collection.mintToTreasury(1, {
      gasLimit: 400_000n
    });
    await mintTx.wait();
  }

  console.log('Deployer:', deployer.address);
  console.log('Deployer balance:', ethers.formatEther(deployerBalance), 'ETH');
  console.log('DemetraCollection deployed to:', collectionAddress);
  console.log('DemetraAuction deployed to:', await auction.getAddress());
  console.log('Metadata base URI:', metadataBaseURI);
  console.log('Collection 1 created with 6 NFTs in treasury at 0.01 ETH each');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

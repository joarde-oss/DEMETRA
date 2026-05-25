import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.create('sepolia');
  const collectionAddress = process.env.VITE_DEMETRA_COLLECTION_ADDRESS;
  const metadataBaseURI = process.env.NFT_METADATA_BASE_URI ?? 'https://demetra-one.vercel.app/metadata/';

  if (!collectionAddress) {
    throw new Error('VITE_DEMETRA_COLLECTION_ADDRESS is not set');
  }

  const collection = await ethers.getContractAt('DemetraCollection', collectionAddress);
  const tx = await collection.setCollectionBaseURI(1, metadataBaseURI, {
    gasLimit: 300_000n
  });

  await tx.wait();

  console.log('DemetraCollection:', collectionAddress);
  console.log('Collection 1 base URI updated to:', metadataBaseURI);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

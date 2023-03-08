const { ethers, run } = require("hardhat");

async function main() {
  const Contract = await ethers.getContractFactory("EscrowContract");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log(`Escrow contract deployed to ${contract.address}`);

  // verify contract
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contract.address,
      constructorArguments: [],
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

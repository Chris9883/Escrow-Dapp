const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowContract", function () {
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [
      deployer,
      depositor1,
      depositor2,
      beneficiary1,
      beneficiary2,
      arbiter1,
      arbiter2,
    ] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("EscrowContract");
    const contract = await Contract.deploy();

    const depositAmount = ethers.utils.parseEther("1");

    return {
      contract,
      deployer,
      depositor1,
      depositor2,
      beneficiary1,
      beneficiary2,
      arbiter1,
      arbiter2,
      depositAmount,
    };
  }

  describe("new escrow agreement", () => {
    it("sets depositor, beneficiary, arbiter and locked amount correctly", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      // new escrow will have escrow id 0
      expect(await contract.getDepositor(0)).to.equal(depositor1.address);
      expect(await contract.getBeneficiary(0)).to.equal(beneficiary1.address);
      expect(await contract.getArbiter(0)).to.equal(arbiter1.address);
      expect(await contract.getLockedAmount(0)).to.equal(depositAmount);
    });

    it("event emitted", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      expect(
        await contract
          .connect(depositor1)
          .createNewEscrow(beneficiary1.address, arbiter1.address, {
            value: depositAmount,
          })
      ).to.emit(contract, "newEscrow");
    });

    it("fails if arbiter is same address as depositor or beneficiary", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await expect(
        contract
          .connect(depositor1)
          .createNewEscrow(beneficiary1.address, depositor1.address)
      ).to.be.revertedWithCustomError(
        contract,
        "Escrow__IndependentArbiterNeeded"
      );
      await expect(
        contract
          .connect(depositor1)
          .createNewEscrow(beneficiary1.address, beneficiary1.address)
      ).to.be.revertedWithCustomError(
        contract,
        "Escrow__IndependentArbiterNeeded"
      );
    });
  });

  describe("escrow agreement fulfilled", () => {
    it("arbiter can approve, beneficiary is paid out, event emitted", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      let balanceBeneficiaryBefore = await beneficiary1.getBalance();
      expect(await contract.connect(arbiter1).approve(0)).to.emit(
        contract,
        "Approved"
      );
      let balanceBeneficiaryAfter = await beneficiary1.getBalance();
      assert(
        (balanceBeneficiaryAfter = balanceBeneficiaryBefore + depositAmount)
      );
    });

    it("only arbiter can approve", async () => {
      const {
        contract,
        deployer,
        depositor1,
        beneficiary1,
        arbiter1,
        depositAmount,
      } = await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      await expect(
        contract.connect(depositor1).approve(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
      await expect(
        contract.connect(beneficiary1).approve(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
      await expect(
        contract.connect(deployer).approve(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
    });

    it("agreement can only be approved once", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      await contract.connect(arbiter1).approve(0);
      await expect(
        contract.connect(arbiter1).approve(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__AlreadyPaidOut");
    });
  });

  describe("escrow agreement cancelled", () => {
    it("arbiter can revoke agreement, depositor gets money back, event emitted", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      let balanceDepositorBefore = await depositor1.getBalance();
      expect(await contract.connect(arbiter1).revoke(0)).to.emit(
        contract,
        "Revoked"
      );
      let balanceDepositorAfter = await depositor1.getBalance();
      assert((balanceDepositorAfter = balanceDepositorBefore + depositAmount));
    });

    it("only arbiter can revoke", async () => {
      const {
        contract,
        deployer,
        depositor1,
        beneficiary1,
        arbiter1,
        depositAmount,
      } = await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      await expect(
        contract.connect(depositor1).revoke(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
      await expect(
        contract.connect(beneficiary1).revoke(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
      await expect(
        contract.connect(deployer).revoke(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__NotAuthorized");
    });

    it("agreement can only be revoked once", async () => {
      const { contract, depositor1, beneficiary1, arbiter1, depositAmount } =
        await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      await contract.connect(arbiter1).revoke(0);
      await expect(
        contract.connect(arbiter1).revoke(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__AlreadyPaidOut");
    });

    it("can not be revoked after already being approved and vice versa", async () => {
      const {
        contract,
        depositor1,
        depositor2,
        beneficiary1,
        beneficiary2,
        arbiter1,
        arbiter2,
        depositAmount,
      } = await loadFixture(deployFixture);
      await contract
        .connect(depositor1)
        .createNewEscrow(beneficiary1.address, arbiter1.address, {
          value: depositAmount,
        });
      await contract.connect(arbiter1).revoke(0);
      await expect(
        contract.connect(arbiter1).approve(0)
      ).to.be.revertedWithCustomError(contract, "Escrow__AlreadyPaidOut");
      // create second agreement, escrowId 1
      await contract
        .connect(depositor2)
        .createNewEscrow(beneficiary2.address, arbiter2.address, {
          value: depositAmount,
        });
      await contract.connect(arbiter2).approve(1);
      await expect(
        contract.connect(arbiter2).revoke(1)
      ).to.be.revertedWithCustomError(contract, "Escrow__AlreadyPaidOut");
    });
  });
});

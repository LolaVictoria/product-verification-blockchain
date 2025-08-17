const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductAuth", function () {
  let productAuth;
  let owner;
  let manufacturer;
  let otherAccount;

  beforeEach(async function () {
    [owner, manufacturer, otherAccount] = await ethers.getSigners();
    const ProductAuth = await ethers.getContractFactory("ProductAuth");
    productAuth = await ProductAuth.deploy();
    await productAuth.waitForDeployment();
  });

  describe("Access Control", function () {
    it("Should set the deployer as owner", async function () {
      expect(await productAuth.owner()).to.equal(owner.address);
    });

    it("Should allow owner to authorize manufacturers", async function () {
      await productAuth.authorizeManufacturer(manufacturer.address);
      expect(await productAuth.authorizedManufacturers(manufacturer.address)).to.be.true;
    });

    it("Should not allow non-owner to authorize manufacturers", async function () {
      await expect(
        productAuth.connect(otherAccount).authorizeManufacturer(manufacturer.address)
      ).to.be.revertedWithCustomError(productAuth, "UnauthorizedAccess");
    });
  });

  describe("Product Registration", function () {
    beforeEach(async function () {
      await productAuth.authorizeManufacturer(manufacturer.address);
    });

    it("Should allow authorized manufacturer to register product", async function () {
      const serialNumber = "SN001";
      const productName = "Test Product";
      const category = "Electronics";

      await expect(
        productAuth.connect(manufacturer).registerProduct(
          serialNumber,
          productName,
          category
        )
      ).to.emit(productAuth, "ProductRegistered")
        .withArgs(serialNumber, manufacturer.address, productName, await getLatestTimestamp());

      const [verified, mfr, name, cat, timestamp] = await productAuth.verifyProduct(serialNumber);
      expect(verified).to.be.true;
      expect(mfr).to.equal(manufacturer.address);
      expect(name).to.equal(productName);
      expect(cat).to.equal(category);
    });

    it("Should not allow duplicate product registration", async function () {
      const serialNumber = "SN001";
      const productName = "Test Product";
      const category = "Electronics";

      await productAuth.connect(manufacturer).registerProduct(
        serialNumber,
        productName,
        category
      );

      await expect(
        productAuth.connect(manufacturer).registerProduct(
          serialNumber,
          productName,
          category
        )
      ).to.be.revertedWithCustomError(productAuth, "ProductAlreadyExists");
    });
  });

  describe("Product Verification", function () {
    it("Should return false for non-existent product", async function () {
      expect(await productAuth.isProductVerified("NONEXISTENT")).to.be.false;
    });
  });

  async function getLatestTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1; // Next block timestamp
  }
});
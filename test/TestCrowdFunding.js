const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFunding", function () {
  let CrowdFunding, crowdFunding;
  let owner, addr1, addr2;

  beforeEach(async function () {
    CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    [owner, addr1, addr2] = await ethers.getSigners(); // Signers simulate different addresses
    crowdFunding = await CrowdFunding.deploy(); // Deploy the contract
    await crowdFunding.deployed();
  });

  it("Should create a campaign", async function () {
    const campaignTitle = "Test Campaign";
    const campaignDescription = "This is a test description";
    const targetAmount = ethers.utils.parseEther("10"); // Target of 10 ETH
    const futureDeadline =
      (await ethers.provider.getBlock("latest")).timestamp + 1000; // Deadline in the future
    const campaignImage = "http://image.url";

    await expect(
      crowdFunding.createCampaign(
        owner.address,
        campaignTitle,
        campaignDescription,
        targetAmount,
        futureDeadline,
        campaignImage
      )
    )
      .to.emit(crowdFunding, "CampaignCreated")
      .withArgs(0, owner.address, campaignTitle, targetAmount, futureDeadline); // Check if event emitted

    const campaignData = await crowdFunding.campaigns(0);

    expect(campaignData.owner).to.equal(owner.address);
    expect(campaignData.title).to.equal(campaignTitle);
    expect(campaignData.target).to.equal(targetAmount);
    expect(campaignData.deadline).to.equal(futureDeadline);
  });

  it("Should revert if the deadline is not in the future", async function () {
    // const pastDeadline =
    //   (await ethers.provider.getBlock("latest")).timestamp - 10000000; // Deadline in the past

    // console.log("Past Deadline:", pastDeadline);

    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;
    const pastDeadline = currentTimestamp - 60000; // Set a past timestamp

    console.log("Current Block Timestamp:", currentTimestamp);
    console.log("Past Deadline:", pastDeadline);

    await expect(
      crowdFunding.createCampaign(
        owner.address,
        "Past Campaign",
        "Invalid deadline",
        ethers.utils.parseEther("5"),
        pastDeadline,
        "image-url"
        // "image.png"
      )
    ).to.be.revertedWith("The deadline should be a date in the future.");
  });

  it("Should allow a user to donate to a campaign and update amount collected", async function () {
    const targetAmount = ethers.utils.parseEther("10");
    const futureDeadline =
      (await ethers.provider.getBlock("latest")).timestamp + 1000;
    await crowdFunding.createCampaign(
      owner.address,
      "Donation Test",
      "Testing donations",
      targetAmount,
      futureDeadline,
      "image.png"
    );

    const donationAmount = ethers.utils.parseEther("1");
    await crowdFunding
      .connect(addr1)
      .donateToCampaign(0, { value: donationAmount }); // addr1 donates 1 ETH

    const campaignData = await crowdFunding.campaigns(0);
    expect(campaignData.amountCollected).to.equal(donationAmount);

    const donators = await crowdFunding.getDonators(0);
    expect(donators[0][0]).to.equal(addr1.address);
    expect(donators[1][0]).to.equal(donationAmount);
  });

  it("Should return all campaigns", async function () {
    await crowdFunding.createCampaign(
      owner.address,
      "Campaign 1",
      "First Campaign",
      ethers.utils.parseEther("10"),
      (await ethers.provider.getBlock("latest")).timestamp + 1000,
      "image1.png"
    );
    await crowdFunding.createCampaign(
      owner.address,
      "Campaign 2",
      "Second Campaign",
      ethers.utils.parseEther("5"),
      (await ethers.provider.getBlock("latest")).timestamp + 1000,
      "image2.png"
    );

    const allCampaigns = await crowdFunding.getCampaigns();
    expect(allCampaigns.length).to.equal(2);
    expect(allCampaigns[0].title).to.equal("Campaign 1");
    expect(allCampaigns[1].title).to.equal("Campaign 2");
  });
});

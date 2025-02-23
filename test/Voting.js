const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");


describe("Voting Contract", function () {
  
    // Fixture pour déployer le contrat Voting et enregistrer un votant (addr1)
    async function deployVotingFixture() {
        const Voting = await ethers.getContractFactory("Voting");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const voting = await Voting.deploy();

        // Initial setup: Register addr1 as a voter
        await voting.addVoter(addr1.address);

        return { voting, owner, addr1, addr2 };
    }

    // Charge la fixture avant chaque test
    let voting, owner, addr1, addr2;
    beforeEach(async function () {
        ({ voting, owner, addr1, addr2 } = await loadFixture(deployVotingFixture));
    });

    // * DEPLOIEMENT DU CONTRAT
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await voting.owner()).to.equal(owner.address);
        });

        it("Should start in RegisteringVoters workflow", async function () {
            expect(await voting.workflowStatus()).to.equal(0);
        });
    });

    // * WORKFLOW STATUS CHANGES
    describe("Workflow Status Transitions", function () {
        it("Should transition through all workflow statuses correctly", async function () {
            await voting.startProposalsRegistering();
            expect(await voting.workflowStatus()).to.equal(1);

            await voting.endProposalsRegistering();
            expect(await voting.workflowStatus()).to.equal(2);

            await voting.startVotingSession();
            expect(await voting.workflowStatus()).to.equal(3);

            await voting.endVotingSession();
            expect(await voting.workflowStatus()).to.equal(4);

            await voting.tallyVotes();
            expect(await voting.workflowStatus()).to.equal(5);
        });

        it("Should prevent invalid workflow transitions", async function () {
            await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
            await voting.startProposalsRegistering();
            await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
        });
    });

    // * ENREGISTREMENT DES VOTANTS
    describe("Voter Registration", function () {
        it("Should register a voter", async function () {
            const voter = await voting.connect(addr1).getVoter(addr1.address);
            expect(voter.isRegistered).to.be.true;
        });

        it("Should NOT allow non-registered voter to get voter information", async function () {
            await expect(voting.connect(addr2).getVoter(addr1.address)).to.be.revertedWith("You're not a voter");
        });

        it("Should not allow non-owner to register a voter", async function () {
            await expect(
            voting.connect(addr1).addVoter(addr2.address)
            ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
        });

        it("Should NOT allow registration when workflow is NOT RegisteringVoters", async function () {
            await voting.startProposalsRegistering();
            await expect(voting.addVoter(addr2.address)).to.be.revertedWith("Voters registration is not open yet");
        });

        it("Should NOT allow duplicate voter registration", async function () {
            await expect(
                voting.addVoter(addr1.address)
            ).to.be.revertedWith("Already registered");
        });
    });

    // * ENREGISTREMENT DES PROPOSITIONS
    describe("Proposal Registration", function () {
        beforeEach(async function () {
            ({ voting, owner, addr1, addr2 } = await loadFixture(deployVotingFixture));
            await voting.startProposalsRegistering();
        });

        it("Should register a proposal", async function () {
            await voting.connect(addr1).addProposal("Proposal 1");
            const proposal = await voting.connect(addr1).getOneProposal(1);
            expect(proposal.description).to.equal("Proposal 1");
        });

        it("Should NOT allow an empty proposal", async function () {
            await expect(voting.connect(addr1).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
        });

        it("Should not allow non-registered voter to add a proposal", async function () {
            await expect(
                voting.connect(addr2).addProposal("Proposal 2")
            ).to.be.revertedWith("You're not a voter");
        });

        it("Should NOT allow adding proposals after ProposalsRegistrationEnded", async function () {
            await voting.endProposalsRegistering();
            await expect(voting.connect(addr1).addProposal("Proposal 2")).to.be.revertedWith("Proposals are not allowed yet");
        });
    });

    // * SESSION DE VOTE 
    describe("Voting Session", function () {
        beforeEach(async function () {
            await voting.startProposalsRegistering();
            await voting.connect(addr1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
        });

        it("Should allow a registered voter to vote", async function () {
            await voting.connect(addr1).setVote(1);
            const voter = await voting.connect(addr1).getVoter(addr1.address);
            expect(voter.hasVoted).to.be.true;
            expect(voter.votedProposalId).to.equal(1);
        });

        it("Should NOT allow voting before VotingSessionStarted", async function () {
            await voting.endVotingSession();  // End session first
            await expect(voting.connect(addr1).setVote(1)).to.be.revertedWith("Voting session havent started yet");
        });

        it("Should not allow double voting", async function () {
            await voting.connect(addr1).setVote(1);
            await expect(
                voting.connect(addr1).setVote(1)
            ).to.be.revertedWith("You have already voted");
        });

        it("Should NOT allow voting for non-existent proposal", async function () {
            await expect(voting.connect(addr1).setVote(99)).to.be.revertedWith("Proposal not found");
        });
    });

    // * FIN DE SESSION DE VOTE
    describe("End Voting Session", function () {
        beforeEach(async function () {
            await voting.startProposalsRegistering();
            await voting.connect(addr1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
        });

        it("Should not allow a registered voter to vote after the session is ended", async function () {
            await voting.endVotingSession();
            await expect(
                voting.connect(addr1).setVote(1)
            ).to.be.revertedWith("Voting session havent started yet");
        });
    });

    // * CALCUL DES VOTES
    describe("Tally Votes", function () {
        beforeEach(async function () {
            await voting.addVoter(addr2.address);
            await voting.startProposalsRegistering();
            await voting.connect(addr1).addProposal("Proposal 1");
            await voting.connect(addr2).addProposal("Proposal 2");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await voting.connect(addr1).setVote(1);
            await voting.connect(addr2).setVote(2);
            await voting.endVotingSession();
        });


        it("Should tally votes and determine the winner", async function () {
            await voting.tallyVotes();
            const winningProposalID = await voting.winningProposalID();
            expect(winningProposalID).to.equal(1);
        });

        it("Should transition workflowStatus to VotesTallied", async function () {
            await voting.tallyVotes();
            expect(await voting.workflowStatus()).to.equal(5);
        });

        it("Should handle the case where no votes are cast", async function () {
            await voting.tallyVotes();

            const winningProposalID = await voting.winningProposalID();
            expect(winningProposalID).to.equal(1);
        });
    });

});

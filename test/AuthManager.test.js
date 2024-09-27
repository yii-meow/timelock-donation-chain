const AuthManager = artifacts.require("AuthManager");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("AuthManager", (accounts) => {
    const [admin, user1, user2, charity1, charity2] = accounts;
    let authManager;

    beforeEach(async () => {
        authManager = await AuthManager.new({ from: admin });
    });

    describe("User Registration and Management", () => {
        it("should register a user", async () => {
            const result = await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });

            expectEvent(result, 'UserRegistered', {
                userAddress: user1,
                name: "Alice",
                email: "alice@example.com"
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            expect(userDetails.name).to.equal("Alice");
            expect(userDetails.email).to.equal("alice@example.com");
            expect(userDetails.isActive).to.be.true;
        });

        it("should update user details", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
            const result = await authManager.updateUserDetails("Alice Updated", "aliceupdated@example.com", { from: user1 });

            expectEvent(result, 'UserUpdated', {
                userAddress: user1,
                name: "Alice Updated",
                email: "aliceupdated@example.com"
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            expect(userDetails.name).to.equal("Alice Updated");
            expect(userDetails.email).to.equal("aliceupdated@example.com");
        });

        it("should toggle user activation", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });

            let result = await authManager.toggleUserActivation({ from: user1 });
            expectEvent(result, 'UserDeactivated', { userAddress: user1 });

            let isActive = await authManager.isUserActive(user1);
            expect(isActive).to.be.false;

            result = await authManager.toggleUserActivation({ from: user1 });
            expectEvent(result, 'UserReactivated', { userAddress: user1 });

            isActive = await authManager.isUserActive(user1);
            expect(isActive).to.be.true;
        });
    });

    describe("Charity Registration and Management", () => {
        it("should register a charity", async () => {
            const result = await authManager.registerAsCharity(
                "Charity One",
                "Description for Charity One",
                charity1,
                0,
                ["tag1", "tag2"],
                { from: charity1 }
            );

            expectEvent(result, 'CharityRegistered', {
                charityAddress: charity1,
                name: "Charity One",
                description: "Description for Charity One",
                category: '0'
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            expect(charityDetails.name).to.equal("Charity One");
            expect(charityDetails.description).to.equal("Description for Charity One");
            expect(charityDetails.isApproved).to.be.false;
            expect(charityDetails.isActive).to.be.true;
            expect(charityDetails.category.toString()).to.equal('0');
            expect(charityDetails.tags).to.deep.equal(["tag1", "tag2"]);
        });

        it("should update charity details", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const result = await authManager.updateCharityDetails(
                "Charity One Updated",
                "Updated Description",
                1,
                ["tag1", "tag2"],
                { from: charity1 }
            );

            expectEvent(result, 'CharityUpdated', {
                charityAddress: charity1,
                name: "Charity One Updated",
                description: "Updated Description",
                category: '1'
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            expect(charityDetails.name).to.equal("Charity One Updated");
            expect(charityDetails.description).to.equal("Updated Description");
            expect(charityDetails.category.toString()).to.equal('1');
            expect(charityDetails.tags).to.deep.equal(["tag1", "tag2"]);
        });

        it("should toggle charity activation", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });

            let result = await authManager.toggleCharityActivation({ from: charity1 });
            expectEvent(result, 'CharityDeactivated', { charityAddress: charity1 });

            let isActive = await authManager.isCharityActive(charity1);
            expect(isActive).to.be.false;

            result = await authManager.toggleCharityActivation({ from: charity1 });
            expectEvent(result, 'CharityReactivated', { charityAddress: charity1 });

            isActive = await authManager.isCharityActive(charity1);
            expect(isActive).to.be.true;
        });
    });

    describe("Admin Functions", () => {
        it("should allow admin to approve a charity", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const result = await authManager.approveCharity(charity1, { from: admin });

            expectEvent(result, 'CharityApproved', { charityAddress: charity1 });

            const isApproved = await authManager.isCharityApproved(charity1);
            expect(isApproved).to.be.true;
        });

        it("should allow admin to disapprove a charity", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            await authManager.approveCharity(charity1, { from: admin });
            const result = await authManager.disapproveCharity(charity1, { from: admin });

            expectEvent(result, 'CharityDisapproved', { charityAddress: charity1 });

            const isApproved = await authManager.isCharityApproved(charity1);
            expect(isApproved).to.be.false;
        });
    });

    describe("Utility Functions", () => {
        it("should return correct category name", async () => {
            const categoryName = await authManager.getCategoryName(0);
            expect(categoryName).to.equal("Education");
        });

        it("should return correct category count", async () => {
            const categoryCount = await authManager.getCategoryCount();
            expect(categoryCount.toNumber()).to.equal(8);
        });

        it("should check if user is registered", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
            const isRegistered = await authManager.isUserRegistered(user1);
            expect(isRegistered).to.be.true;
        });

        it("should check if charity is registered", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const isRegistered = await authManager.isCharityRegistered(charity1);
            expect(isRegistered).to.be.true;
        });

        it("should get user name by address", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
            const userName = await authManager.getUserNameByAddress(user1);
            expect(userName).to.equal("Alice");
        });

        it("should get all users and charities", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
            await authManager.registerAsUser("Bob", "bob@example.com", { from: user2 });
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });

            const allUsers = await authManager.getAllUsers();
            expect(allUsers).to.deep.equal([user1, user2]);

            const allCharities = await authManager.getAllCharities();
            expect(allCharities).to.deep.equal([charity1]);
        });

        it("should check if address is admin", async () => {
            const isAdmin = await authManager.isAdmin(admin);
            expect(isAdmin).to.be.true;

            const isNotAdmin = await authManager.isAdmin(user1);
            expect(isNotAdmin).to.be.false;
        });

        it("should get user and charity count", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });

            const userCount = await authManager.getUserCount();
            expect(userCount.toNumber()).to.equal(1);

            const charityCount = await authManager.getCharityCount();
            expect(charityCount.toNumber()).to.equal(1);
        });
    });
});
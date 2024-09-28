const AuthManager = artifacts.require("AuthManager");
const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("AuthManager", (accounts) => {
    const [admin, user1, user2, charity1, charity2] = accounts;
    let authManager;

    beforeEach(async () => {
        authManager = await AuthManager.new({ from: admin });
    });

    describe("User Registration and Management", () => {
        it("should register a user successfully", async () => {
            const result = await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            expectEvent(result, 'UserRegistered', { userAddress: user1, name: "John Doe", email: "john@example.com" });
        });

        it("should not allow duplicate user registration", async () => {
            await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            await expectRevert(
                authManager.registerAsUser("John Doe", "john@example.com", { from: user1 }),
                "Invalid input"
            );
        });

        it("should update user details", async () => {
            await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            const result = await authManager.updateUserDetails("John Updated", "johnupdated@example.com", { from: user1 });
            expectEvent(result, 'UserUpdated', { userAddress: user1, name: "John Updated", email: "johnupdated@example.com" });
        });

        it("should toggle user activation", async () => {
            await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            const result = await authManager.toggleUserActivation({ from: user1 });
            expectEvent(result, 'UserDeactivated', { userAddress: user1 });

            const secondToggle = await authManager.toggleUserActivation({ from: user1 });
            expectEvent(secondToggle, 'UserReactivated', { userAddress: user1 });
        });
    });

    describe("Charity Registration and Management", () => {
        it("should register a user successfully", async () => {
            const result = await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            expectEvent(result, 'UserRegistered', { userAddress: user1, name: "John Doe", email: "john@example.com" });
        });

        it("should not allow duplicate user registration", async () => {
            await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            await expectRevert(
                authManager.registerAsUser("John Doe", "john@example.com", { from: user1 }),
                "Invalid input"
            );
        });

        it("should not allow duplicate charity registration", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            await expectRevert(
                authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 }),
                "Already registered"
            );
        });

        it("should update charity details", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const result = await authManager.updateCharityDetails("Charity One Updated", "New Description", 1, ["tag2", "tag3"], { from: charity1 });
            expectEvent(result, 'CharityUpdated', {
                charityAddress: charity1,
                name: "Charity One Updated",
                description: "New Description",
                category: "1",
            });
        });

        it("should toggle charity activation", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const result = await authManager.toggleCharityActivation({ from: charity1 });
            expectEvent(result, 'CharityDeactivated', { charityAddress: charity1 });

            const secondToggle = await authManager.toggleCharityActivation({ from: charity1 });
            expectEvent(secondToggle, 'CharityReactivated', { charityAddress: charity1 });
        });
    });

    describe("Admin Functions", () => {
        it("should allow admin to approve a charity", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const result = await authManager.approveCharity(charity1, { from: admin });
            expectEvent(result, 'CharityApproved', { charityAddress: charity1 });
        });

        it("should allow admin to disapprove a charity", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            await authManager.approveCharity(charity1, { from: admin });
            const result = await authManager.disapproveCharity(charity1, { from: admin });
            expectEvent(result, 'CharityDisapproved', { charityAddress: charity1 });
        });

        it("should not allow non-admin to approve or disapprove charities", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            await expectRevert(
                authManager.approveCharity(charity1, { from: user1 }),
                "Unauthorized"
            );
            await expectRevert(
                authManager.disapproveCharity(charity1, { from: user1 }),
                "Unauthorized"
            );
        });
    });

    describe("Getters and Utility Functions", () => {
        it("should return correct user details", async () => {
            await authManager.registerAsUser("John Doe", "john@example.com", { from: user1 });
            const userDetails = await authManager.getUserDetails({ from: user1 });
            assert.equal(userDetails.name, "John Doe");
            assert.equal(userDetails.email, "john@example.com");
            assert.equal(userDetails.isActive, true);
        });

        it("should return correct charity details", async () => {
            await authManager.registerAsCharity("Charity One", "Description", charity1, 0, ["tag1"], { from: charity1 });
            const charityDetails = await authManager.getCharityDetails(charity1);
            assert.equal(charityDetails.name, "Charity One");
            assert.equal(charityDetails.description, "Description");
            assert.equal(charityDetails.walletAddress, charity1);
            assert.equal(charityDetails.isApproved, false);
            assert.equal(charityDetails.isActive, true);
            assert.equal(charityDetails.category, 0);
            assert.deepEqual(charityDetails.tags, ["tag1"]);
        });

        it("should return correct category name", async () => {
            const categoryName = await authManager.getCategoryName(0);
            assert.equal(categoryName, "Education");
        });

        it("should return correct user and charity counts", async () => {
            await authManager.registerAsUser("User1", "user1@example.com", { from: user1 });
            await authManager.registerAsUser("User2", "user2@example.com", { from: user2 });
            await authManager.registerAsCharity("Charity1", "Description1", charity1, 0, ["tag1"], { from: charity1 });

            const userCount = await authManager.getUserCount();
            const charityCount = await authManager.getCharityCount();

            assert.equal(userCount, 2);
            assert.equal(charityCount, 1);
        });

        it("should correctly identify admin", async () => {
            const isAdminResult = await authManager.isAdmin(admin);
            assert.equal(isAdminResult, true);

            const isNotAdminResult = await authManager.isAdmin(user1);
            assert.equal(isNotAdminResult, false);
        });
    });

    describe("Input Validation", () => {
        it("should not allow registration with invalid email", async () => {
            await expectRevert(
                authManager.registerAsUser("John Doe", "invalidemail", { from: user1 }),
                "Invalid input"
            );
        });

        it("should not allow registration with empty name", async () => {
            await expectRevert(
                authManager.registerAsUser("", "john@example.com", { from: user1 }),
                "Invalid input"
            );
        });

        it("should not allow charity registration with invalid category", async () => {
            const invalidCategory = 100;
            await expectRevert(
                authManager.registerAsCharity("Charity One", "Description", charity1, invalidCategory, ["tag1"], { from: charity1 }),
                "Invalid input"
            );
        });

        it("should not allow charity registration with too many tags", async () => {
            const tooManyTags = Array(11).fill("tag");
            await expectRevert(
                authManager.registerAsCharity("Charity One", "Description", charity1, 0, tooManyTags, { from: charity1 }),
                "Invalid input"
            );
        });
    });
});
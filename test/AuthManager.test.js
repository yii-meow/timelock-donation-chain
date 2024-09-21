const AuthManager = artifacts.require("AuthManager");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("AuthManager", (accounts) => {
    let authManager;
    const [admin, user1, user2, charity1, charity2] = accounts;

    beforeEach(async () => {
        authManager = await AuthManager.new({ from: admin });
    });

    describe("User Registration", () => {
        it("should allow a user to register", async () => {
            const result = await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });

            expectEvent(result, 'UserRegistered', {
                userAddress: user1,
                name: "Alice",
                email: "alice@example.com"
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            assert.equal(userDetails.name, "Alice");
            assert.equal(userDetails.email, "alice@example.com");
        });

        it("should not allow a user to register twice", async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });

            await expectRevert(
                authManager.registerAsUser("Alice", "alice@example.com", { from: user1 }),
                "User already registered!"
            );
        });
    });

    describe("Charity Registration", () => {
        it("should allow a charity to register", async () => {
            const result = await authManager.registerAsCharity("Charity A", "Description A", charity1, { from: charity1 });

            expectEvent(result, 'CharityRegistered', {
                charityAddress: charity1,
                name: "Charity A",
                description: "Description A"
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            assert.equal(charityDetails.name, "Charity A");
            assert.equal(charityDetails.description, "Description A");
            assert.equal(charityDetails.walletAddress, charity1);
        });

        it("should not allow a charity to register twice", async () => {
            await authManager.registerAsCharity("Charity A", "Description A", charity1, { from: charity1 });

            await expectRevert(
                authManager.registerAsCharity("Charity A", "Description A", charity1, { from: charity1 }),
                "Charity already registered"
            );
        });
    });

    describe("User and Charity Status Checks", () => {
        it("should correctly report user registration status", async () => {
            assert.isFalse(await authManager.isUserRegistered(user1));

            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });

            assert.isTrue(await authManager.isUserRegistered(user1));
        });

        it("should correctly report charity registration status", async () => {
            assert.isFalse(await authManager.isCharityRegistered(charity1));

            await authManager.registerAsCharity("Charity A", "Description A", charity1, { from: charity1 });

            assert.isTrue(await authManager.isCharityRegistered(charity1));
        });
    });

    describe("User Update and Deactivation", () => {
        beforeEach(async () => {
            await authManager.registerAsUser("Alice", "alice@example.com", { from: user1 });
        });

        it("should allow a user to update their details", async () => {
            const result = await authManager.updateUserDetails("Alice Updated", "alice_updated@example.com", { from: user1 });

            expectEvent(result, 'UserUpdated', {
                userAddress: user1,
                name: "Alice Updated",
                email: "alice_updated@example.com"
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            assert.equal(userDetails.name, "Alice Updated");
            assert.equal(userDetails.email, "alice_updated@example.com");
        });

        it("should allow a user to deactivate their account", async () => {
            const result = await authManager.deactivateUser({ from: user1 });

            expectEvent(result, 'UserDeactivated', {
                userAddress: user1
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            assert.isFalse(userDetails.isActive);
        });

        it("should allow a user to reactivate their account", async () => {
            await authManager.deactivateUser({ from: user1 });
            const result = await authManager.reactivateUser({ from: user1 });

            expectEvent(result, 'UserReactivated', {
                userAddress: user1
            });

            const userDetails = await authManager.getUserDetails({ from: user1 });
            assert.isTrue(userDetails.isActive);
        });

        it("should not allow inactive users to update their details", async () => {
            await authManager.deactivateUser({ from: user1 });

            await expectRevert(
                authManager.updateUserDetails("Alice Updated", "alice_updated@example.com", { from: user1 }),
                "User is not active"
            );
        });
    });

    describe("Charity Update and Deactivation", () => {
        beforeEach(async () => {
            await authManager.registerAsCharity("Charity A", "Description A", charity1, { from: charity1 });
        });

        it("should allow a charity to update their details", async () => {
            const result = await authManager.updateCharityDetails("Charity A Updated", "Description A Updated", { from: charity1 });

            expectEvent(result, 'CharityUpdated', {
                charityAddress: charity1,
                name: "Charity A Updated",
                description: "Description A Updated"
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            assert.equal(charityDetails.name, "Charity A Updated");
            assert.equal(charityDetails.description, "Description A Updated");
        });

        it("should allow a charity to deactivate their account", async () => {
            const result = await authManager.deactivateCharity({ from: charity1 });

            expectEvent(result, 'CharityDeactivated', {
                charityAddress: charity1
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            assert.isFalse(charityDetails.isActive);
        });

        it("should allow a charity to reactivate their account", async () => {
            await authManager.deactivateCharity({ from: charity1 });
            const result = await authManager.reactivateCharity({ from: charity1 });

            expectEvent(result, 'CharityReactivated', {
                charityAddress: charity1
            });

            const charityDetails = await authManager.getCharityDetails(charity1);
            assert.isTrue(charityDetails.isActive);
        });

        it("should not allow inactive charities to update their details", async () => {
            await authManager.deactivateCharity({ from: charity1 });

            await expectRevert(
                authManager.updateCharityDetails("Charity A Updated", "Description A Updated", { from: charity1 }),
                "Charity is not active"
            );
        });
    });
});
const { expect, test } = require('@jest/globals');

const db = require('./dbUtil');
const UserService = require('../modules/users');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());


describe('Users Schema', () => {
    test('createUser', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        // should be able to create new user
        let userExp = expect(await UserService.createUser(rawArgs));
        userExp.toHaveProperty('name', rawArgs.userInput.name);
        userExp.toHaveProperty('email', rawArgs.userInput.email);
        userExp.toHaveProperty('password');
        userExp.toHaveProperty('courses');

        // cannot create duplicate user
        await expect(UserService.createUser(rawArgs)).rejects.toThrow(Error);
    });
    
    test('loginUser', async () => {
        let rawArgs = {
            email: 'fake@email.com',
            password: 'password'
        };

        // cannot find non-existent user
        await expect(UserService.loginUser(rawArgs)).rejects.toThrow(Error);

        let actualPassword = 'foobar';
        rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: actualPassword
            }
        };

        let newUser = await UserService.createUser(rawArgs);

        // incorrect password login error
        rawArgs.userInput.password = 'incorrectPassword';
        await expect(UserService.loginUser(rawArgs.userInput)).rejects.toThrow(Error);

        // successful login
        rawArgs.userInput.password = actualPassword;
        let userExp = expect(await UserService.loginUser(rawArgs.userInput));
        userExp.toHaveProperty('_id');
        userExp.toHaveProperty('name', newUser.name);
        userExp.toHaveProperty('email', newUser.email);
        userExp.toHaveProperty('password');
        userExp.toHaveProperty('courses');
    });

    test('editUser', async () => {
        let rawArgsA = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'password'
            }
        };

        let rawArgsB = {
            userInput: {
                name: 'Bar',
                email: 'bar@foo.com',
                password: 'password'
            }
        };

        // grabbing random userID
        let userA = await UserService.createUser(rawArgsA);
        let randomUserID = userA._id;
        rawArgsA.userID = userA._id;
        await UserService.deleteUser(rawArgsA);

        // creating userA
        userA = await UserService.createUser(rawArgsA);
        rawArgsA.userID = userA._id;
        rawArgsA.password = userA.password;

        // creating userB
        let userB = await UserService.createUser(rawArgsB);
        rawArgsB.userID = userB._id;
        rawArgsB.password = userB.password;
        
        // userID is incorrect
        let correctUserID = rawArgsA.userID;
        rawArgsA.userID = randomUserID;
        await expect(UserService.editUser(rawArgsA)).rejects.toThrow(Error);

        // trying to change email to email that's in use
        rawArgsA.userID = correctUserID;
        rawArgsA.userInput.email = userB.email;
        await expect(UserService.editUser(rawArgsA)).rejects.toThrow(Error);

        // successfully updating email
        rawArgsA.userInput.email = 'foobar@foobar.com';
        let updatedUserExp = expect(await UserService.editUser(rawArgsA));
        updatedUserExp.toHaveProperty('_id');
        updatedUserExp.toHaveProperty('name', userA.name);
        updatedUserExp.toHaveProperty('email', rawArgsA.userInput.email);
        updatedUserExp.toHaveProperty('password');
        updatedUserExp.toHaveProperty('courses');

        // successfully updating user with same credentials
        rawArgsA.userInput.email = 'foobar@foobar.com';
        updatedUserExp = expect(await UserService.editUser(rawArgsA));
        updatedUserExp.toHaveProperty('_id');
        updatedUserExp.toHaveProperty('name', userA.name);
        updatedUserExp.toHaveProperty('email', rawArgsA.userInput.email);
        updatedUserExp.toHaveProperty('password');
        updatedUserExp.toHaveProperty('courses');
    });

    test('deleteUser', async () => {
        rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'password'
            }
        };

        // deleting real user
        let user = await UserService.createUser(rawArgs);
        rawArgs.userID = user._id;
        expect(await UserService.deleteUser(rawArgs)).resolves;

        // can't delete non-existent user
        await expect(UserService.deleteUser(rawArgs)).rejects.toThrow(Error);
    });
});

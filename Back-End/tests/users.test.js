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

        // cannot create a duplicate user
        expect(async _ => await UserService.createUser(rawArgs))
        .rejects;
    });
    
    test('loginUser', async () => {
        let rawArgs = {
            email: 'fake@email.com',
            password: 'password'
        };

        // cannot find non-existent user
        expect(async _ => await UserService.loginUser(rawArgs))
        .rejects;

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
        expect(async _ => await UserService.loginUser(rawArgs))
        .rejects;

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

        let userA = await UserService.createUser(rawArgsA);
        rawArgsA.userID = userA._id;
        rawArgsA.password = userA.password;

        let userB = await UserService.createUser(rawArgsB);
        rawArgsB.userID = userB._id;
        rawArgsB.password = userB.password;
        
        // trying to change email to email that's in use
        rawArgsA.userInput.email = userB.email;
        expect(async _ => await UserService.editUser(rawArgsA))
        .rejects;

        // successfully updating email
        rawArgsA.userInput.email = 'foobar@foobar.com';
        let updatedUserExp = expect(await UserService.editUser(rawArgsA));
        updatedUserExp.toHaveProperty('_id');
        updatedUserExp.toHaveProperty('name', userA.name);
        updatedUserExp.toHaveProperty('email', rawArgsA.userInput.email);
        updatedUserExp.toHaveProperty('password');
        updatedUserExp.toHaveProperty('courses');
    });

    test('deleteUser', async () => {
        let rawArgs = {
            userID: 'missingID'
        };

        // can't delete non-existent user
        expect(async _ => await UserService.deleteUser(rawArgs))
        .rejects;

        // deleting real user
        rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'password'
            }
        };

        let user = await UserService.createUser(rawArgs);
        expect(async _ => await UserService.deleteUser(rawArgs))
        .resolves;
    });
});

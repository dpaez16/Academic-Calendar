const { expect, test } = require('@jest/globals');
const request = require('supertest');

const db = require('./dbUtil');
const UserService = require('../modules/users');
const forgotPassword = require('../modules/forgotPassword');
const app = require('../app');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());


describe('Forgot password tests', () => {
    test('Forgot Password Service - Email not found', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        await UserService.createUser(rawArgs);
        await request(app)
            .post('/ac/forgotPassword')
            .send({ email: "NOTAREALEMAIL" })
            .expect(400)
            .then((res) => {
                expect(res.body).toHaveProperty('error');
            })
            .catch((err) => {
                throw err;
            });
    });
    
    test('Forgot Password Service - Email invalid', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        await UserService.createUser(rawArgs);
        await request(app)
            .post('/ac/forgotPassword')
            .send({})
            .expect(400)
            .then((res) => {
                expect(res.body).toHaveProperty('error');
            })
            .catch((err) => {
                throw err;
            });
    });

    test('Forgot Password Service - Email found', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        let user = await UserService.createUser(rawArgs);
        await request(app)
            .post('/ac/forgotPassword')
            .send({ email: user.email })
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('message');
            })
            .catch((err) => {
                throw err;
            });
    });
});

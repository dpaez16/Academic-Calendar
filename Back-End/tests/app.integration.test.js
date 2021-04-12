const { test } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');

describe('App integration test', () => {
    test('Grade service', () => {
        let data = {
            categories: [],
            weighted: true
        };
        
        request(app)
            .post('/ac/grade')
            .send(JSON.stringify(data))
            .set('Content-Type', 'application/json')
            //.set('Accept', 'application/json')
            .type('/json/')
            .expect(400)
            .end((err, res) => {
                if (err) throw err;
                console.log(res.body);
            });
    });
});
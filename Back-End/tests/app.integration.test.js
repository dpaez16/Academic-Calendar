const { expect, test } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const app = require('../app');

describe('App integration test', () => {
    test('Grade service', async () => {
        let data = {
            categories: [],
            weighted: true
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body).toHaveProperty('error');
            })
            .catch((err) => {
                throw err;
            });
    });
});
const { expect, test } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');

createMockCategory = function(weight) {
    let scores = [];

    for (let i = 0; i < 10; i++) {
        const score = Math.floor(Math.random() * 100);
        scores.push(score);
    }

    return {
        elements: scores.map((_, idx) => { return {score: scores[idx], total: 100} }),
        weight: weight
    };
}

createEmptyMockCategory = function(weight) {
    return {
        elements: [],
        weight: weight
    }
}

createZeroTotalCategory = function(weight) {
    return {
        elements: [{score: 0, total: 0}],
        weight: weight
    }
}

describe('App integration test', () => {
    test('Grade service - empty categories', async () => {
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

    test('Grade service - weighted class, weights do not add to 100%', async () => {
        let data = {
            categories: [createMockCategory(10)],
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

    test('Grade service - weighted class, non-zero totals', async () => {
        let data = {
            categories: [createMockCategory(100)],
            weighted: true
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('grade');
            })
            .catch((err) => {
                throw err;
            });
    });

    test('Grade service - weighted class, has a category with total sum 0', async () => {
        let data = {
            categories: [createZeroTotalCategory(100)],
            weighted: true
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('grade');
            })
            .catch((err) => {
                throw err;
            });
    });

    test('Grade service - unweighted class, non-zero totals', async () => {
        let data = {
            categories: [createMockCategory()],
            weighted: false
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('grade');
            })
            .catch((err) => {
                throw err;
            });
    });

    test('Grade service - unweighted class, has a category with total sum 0', async () => {
        let data = {
            categories: [createZeroTotalCategory()],
            weighted: false
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('grade');
            })
            .catch((err) => {
                throw err;
            });
    });

    test('Grade service - empty category', async () => {
        let data = {
            categories: [createEmptyMockCategory()],
            weighted: false
        };
        
        await request(app)
            .post('/ac/grade')
            .send(data)
            .expect(200)
            .then((res) => {
                expect(res.body).toHaveProperty('grade');
            })
            .catch((err) => {
                throw err;
            });
    });
});
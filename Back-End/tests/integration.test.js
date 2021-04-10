const { expect, test } = require('@jest/globals');

const db = require('./dbUtil');
const UserService = require('../modules/users');
const CoursesService = require('../modules/courses');
const CategoriesService = require('../modules/categories');
const CategoryElementsService = require('../modules/categoryElements');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());

describe('All User Actions', () => {
    test('Create user, courses, and populate categories', async () => {
        let rawArgs = {
            userInput: {
                name: "Foo",
                email: "foo@bar.com",
                password: "password"
            }
        }

        let user = await UserService.createUser(rawArgs);

        rawArgs = {
            courseInput: {
                subject: "CS",
                courseNum: 101,
                courseName: "Intro to CS",
                weighted: true,
                creator: user._id
            }
        };

        let course = await CoursesService.createCourse(rawArgs);

        rawArgs = {
            categoryInput: {
                name: 'HW',
                weight: 10,
                courseID: course._id
            }
        };

        let category = await CategoriesService.createCategory(rawArgs);

        let dueDate = Date.now().toString();
        rawArgs = {
            categoryElementInput: {
                name: 'HW1',
                score: 10,
                total: 10,
                dueDate: dueDate,
                categoryID: category._id
            }
        };

        let categoryElement = await CategoryElementsService.createCategoryElement(rawArgs);

        rawArgs.userID = user._id;
        expect(await UserService.deleteUser(rawArgs)).resolves;
    });
});
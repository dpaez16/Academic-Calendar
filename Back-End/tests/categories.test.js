const { expect, test } = require('@jest/globals');

const db = require('./dbUtil');
const UserService = require('../modules/users');
const CoursesService = require('../modules/courses');
const CategoriesService = require('../modules/categories');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());


describe('Categories Schema', () => {
    test('createCategory', async () => {
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
        let courseID = course._id;

        // adding category for non-existent course
        let incorrectCourseID = user._id;
        rawArgs = {
            categoryInput: {
                name: 'HW',
                weight: 10,
                courseID: incorrectCourseID
            }
        };

        await expect(CategoriesService.createCategory(rawArgs)).rejects.toThrow(Error);

        // adding new category
        rawArgs.categoryInput.courseID = courseID;
        let categoryExp = expect(await CategoriesService.createCategory(rawArgs));
        categoryExp.toHaveProperty('_id');
        categoryExp.toHaveProperty('name', rawArgs.categoryInput.name);
        categoryExp.toHaveProperty('weight', rawArgs.categoryInput.weight);
        categoryExp.toHaveProperty('elements');
        categoryExp.toHaveProperty('courseID', courseID);

        // cannot add duplicate category
        await expect(CategoriesService.createCategory(rawArgs)).rejects.toThrow(Error);
    });

    test('getCategories', async () => {
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
        let categoryID = category._id;

        // getting a correct and incorrect categoryID
        rawArgs.categoryIDS = [categoryID, user._id];
        await expect(CategoriesService.getCategories(rawArgs)).rejects.toThrow(Error);

        // getting a correct categoryID
        rawArgs.categoryIDS = [categoryID];
        expect(await CategoriesService.getCategories(rawArgs)).resolves;
    });

    test('editCategory', async () => {
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
        let categoryID = category._id;

        // editing non-existing category
        rawArgs.categoryID = course._id;
        await expect(CategoriesService.editCategory(rawArgs)).rejects.toThrow(Error);

        // edit category, but no changes are made
        rawArgs.categoryID = categoryID;
        await expect(CategoriesService.editCategory(rawArgs)).rejects.toThrow(Error);

        // making actual changes to a category
        rawArgs.categoryInput.name = 'Midterms'
        let categoryExp = expect(await CategoriesService.editCategory(rawArgs));
        categoryExp.toHaveProperty('_id');
        categoryExp.toHaveProperty('name', rawArgs.categoryInput.name);
        categoryExp.toHaveProperty('weight', rawArgs.categoryInput.weight);
        categoryExp.toHaveProperty('elements');
        categoryExp.toHaveProperty('courseID', course._id);
    });

    test('deleteCategory', async () => {
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
        let categoryID = category._id;

        // cannot delete non-existing category
        rawArgs.categoryID = course._id;
        await expect(CategoriesService.deleteCategory(rawArgs)).rejects.toThrow(Error);

        // deleting actual category
        rawArgs.categoryID = categoryID;
        expect(await CategoriesService.deleteCategory(rawArgs)).resolves;
    });
});

const { expect, test } = require('@jest/globals');

const db = require('./dbUtil');
const UserService = require('../modules/users');
const CoursesService = require('../modules/courses');
const CategoriesService = require('../modules/categories');
const CategoryElementsService = require('../modules/categoryElements');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());


describe('Category Elements Schema', () => {
    test('createCategoryElement', async () => {
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

        let dueDate = new Date(`2021-01-01 23:59`);
        rawArgs = {
            categoryElementInput: {
                name: 'HW1',
                score: 10,
                total: 10,
                dueDate: dueDate,
                categoryID: categoryID
            }
        };

        // adding category element to non-existent category
        let incorrectCategoryID = user._id;
        rawArgs.categoryElementInput.categoryID = incorrectCategoryID;
        await expect(CategoryElementsService.createCategoryElement(rawArgs)).rejects.toThrow(Error);

        // adding new category element
        rawArgs.categoryElementInput.categoryID = categoryID;
        let categoryElementExp = expect(await CategoryElementsService.createCategoryElement(rawArgs));
        categoryElementExp.toHaveProperty('_id');
        categoryElementExp.toHaveProperty('name', rawArgs.categoryElementInput.name);
        categoryElementExp.toHaveProperty('score', rawArgs.categoryElementInput.score);
        categoryElementExp.toHaveProperty('total', rawArgs.categoryElementInput.total);
        categoryElementExp.toHaveProperty('dueDate');
        categoryElementExp.toHaveProperty('categoryID', categoryID);
        

        // adding duplicate category element
        await expect(CategoryElementsService.createCategoryElement(rawArgs)).rejects.toThrow(Error);
    });

    test('getCategoryElements', async () => {
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

        let dueDate = new Date(`2021-01-01 23:59`);
        rawArgs = {
            categoryElementInput: {
                name: 'HW1',
                score: 10,
                total: 10,
                dueDate: dueDate,
                categoryID: categoryID
            }
        };

        let categoryElement = await CategoryElementsService.createCategoryElement(rawArgs);
        let categoryElementID = categoryElement._id;

        // get 1 incorrect and 1 correct category element ID
        rawArgs.categoryElementIDS = [categoryID, categoryElementID];
        await expect(CategoryElementsService.getCategoryElements(rawArgs)).rejects.toThrow(Error);

        // get correct category element ID
        rawArgs.categoryElementIDS = [categoryElementID];
        expect(await CategoryElementsService.getCategoryElements(rawArgs)).resolves;
    });

    test('editCategoryElement', async () => {
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

        let dueDate = new Date(`2021-01-01 23:59`);
        rawArgs = {
            categoryElementInput: {
                name: 'HW1',
                score: 10,
                total: 10,
                dueDate: dueDate,
                categoryID: categoryID
            }
        };

        let categoryElement = await CategoryElementsService.createCategoryElement(rawArgs);
        let categoryElementID = categoryElement._id;

        // cannot edit non-existent category element
        rawArgs.categoryElementID = user._id;
        await expect(CategoryElementsService.editCategoryElement(rawArgs)).rejects.toThrow(Error);

        // making no new changes to existing category element
        rawArgs.categoryElementID = categoryElementID;
        await expect(CategoryElementsService.editCategoryElement(rawArgs)).rejects.toThrow(Error);

        rawArgs.categoryElementInput.name = 'HW0';
        let categoryElementExp = expect(await CategoryElementsService.editCategoryElement(rawArgs));
        categoryElementExp.toHaveProperty('_id');
        categoryElementExp.toHaveProperty('name', rawArgs.categoryElementInput.name);
        categoryElementExp.toHaveProperty('score', rawArgs.categoryElementInput.score);
        categoryElementExp.toHaveProperty('total', rawArgs.categoryElementInput.total);
        categoryElementExp.toHaveProperty('dueDate');
        categoryElementExp.toHaveProperty('categoryID', categoryID);
    });

    test('deleteCategoryElement', async () => {
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

        let dueDate = new Date(`2021-01-01 23:59`);
        rawArgs = {
            categoryElementInput: {
                name: 'HW1',
                score: 10,
                total: 10,
                dueDate: dueDate,
                categoryID: categoryID
            }
        };

        let categoryElement = await CategoryElementsService.createCategoryElement(rawArgs);
        let categoryElementID = categoryElement._id;

        // cannot delete non-existing category element
        rawArgs.categoryElementID = user._id;
        await expect(CategoryElementsService.deleteCategoryElement(rawArgs)).rejects.toThrow(Error);

        // deleting existing category element
        rawArgs.categoryElementID = categoryElementID;
        expect(await CategoryElementsService.deleteCategoryElement(rawArgs)).resolves;
    });
});

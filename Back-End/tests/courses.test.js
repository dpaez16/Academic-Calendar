const { expect, test } = require('@jest/globals');

const db = require('./dbUtil');
const UserService = require('../modules/users');
const CoursesService = require('../modules/courses');

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());


describe('Courses Schema', () => {
    test('createCourse', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

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

        // creating new course to user should work
        let courseExp = expect(await CoursesService.createCourse(rawArgs));
        courseExp.toHaveProperty('_id');
        courseExp.toHaveProperty('subject', rawArgs.courseInput.subject);
        courseExp.toHaveProperty('courseNum', rawArgs.courseInput.courseNum);
        courseExp.toHaveProperty('courseName', rawArgs.courseInput.courseName);
        courseExp.toHaveProperty('weighted', rawArgs.courseInput.weighted);
        courseExp.toHaveProperty('categories');
        courseExp.toHaveProperty('creator', rawArgs.courseInput.creator);

        // creating duplicate course should fail
        await expect(CoursesService.createCourse(rawArgs)).rejects.toThrow(Error);
    });
    
    test('getCourses', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

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
        let courseIDS = [course._id];
        rawArgs.courseIDS = courseIDS;

        // grabbing courses from correct course IDs
        expect(await CoursesService.getCourses(rawArgs)).resolves;
        courseIDS = [user._id, course._id];

        // grabbing an incorrect and correct course ID
        rawArgs.courseIDS = courseIDS;
        await expect(CoursesService.getCourses(rawArgs)).rejects.toThrow(Error);
    });

    test('editCourse', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        let user = await UserService.createUser(rawArgs);
        let incorrectCourseID = user._id;

        // trying to edit non-existent course
        rawArgs = {
            courseInput: {
                subject: "CS",
                courseNum: 101,
                courseName: "Intro to CS",
                weighted: true,
                creator: user._id
            },
            courseID: incorrectCourseID
        };

        await expect(CoursesService.editCourse(rawArgs)).rejects.toThrow(Error);

        // add 2 courses
        let rawArgsA = {
            courseInput: {
                subject: "CS",
                courseNum: 101,
                courseName: "Intro to CS",
                weighted: true,
                creator: user._id
            }
        };

        let rawArgsB = {
            courseInput: {
                subject: "CS",
                courseNum: 102,
                courseName: "Intro to CS 2",
                weighted: true,
                creator: user._id
            }
        };

        let courseA = await CoursesService.createCourse(rawArgsA);
        let courseB = await CoursesService.createCourse(rawArgsB);

        rawArgsA.courseID = courseA._id;
        rawArgsB.courseID = courseB._id;

        // using editCourse to make no changes to courseA
        await expect(CoursesService.editCourse(rawArgsA)).rejects.toThrow(Error);

        // using editCourse to make changes to courseA
        rawArgsA.courseInput.subject = 'ECE';
        rawArgsA.courseInput.courseName = 'Intro to ECE';

        let editCourseExp = expect(await CoursesService.editCourse(rawArgsA));
        editCourseExp.toHaveProperty('_id');
        editCourseExp.toHaveProperty('subject', rawArgsA.courseInput.subject);
        editCourseExp.toHaveProperty('courseNum', rawArgsA.courseInput.courseNum);
        editCourseExp.toHaveProperty('courseName', rawArgsA.courseInput.courseName);
        editCourseExp.toHaveProperty('weighted', rawArgsA.courseInput.weighted);
        editCourseExp.toHaveProperty('categories');
        editCourseExp.toHaveProperty('creator', rawArgsA.courseInput.creator);
    });

    test('deleteCourse', async () => {
        let rawArgs = {
            userInput: {
                name: 'Foo',
                email: 'foo@bar.com',
                password: 'foobar'
            }
        };

        let user = await UserService.createUser(rawArgs);
        let incorrectCourseID = user._id;

        // trying to delete non-existent course        
        rawArgs = {
            courseInput: {
                subject: "CS",
                courseNum: 101,
                courseName: "Intro to CS",
                weighted: true,
                creator: user._id
            },
            courseID: incorrectCourseID
        };

        await expect(CoursesService.deleteCourse(rawArgs)).rejects.toThrow(Error);

        // delete created course should work
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
        rawArgs.courseID = course._id;

        expect(await CoursesService.deleteCourse(rawArgs)).resolves;
    });
});

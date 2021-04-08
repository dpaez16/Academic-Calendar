const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const { loginUser, createUser, editUser, deleteUser } = require('./modules/users');
const { getCourses, createCourse, editCourse, deleteCourse } = require('./modules/courses');
const { getCategories, createCategory, editCategory, deleteCategory } = require('./modules/categories');
const { getCategoryElements, createCategoryElement, editCategoryElement, deleteCategoryElement } = require('./modules/categoryElements');
const { calculateGrade } = require('./modules/grade');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.post('/ac/grade', calculateGrade);

app.use('/ac', graphQLHttp({
    schema: buildSchema(`
        type User {
            _id: ID!
            name: String!
            email: String!
            password: String
            courses: [Course!]!
        }

        input UserInput {
            name: String!
            email: String!
            password: String!
        }

        type Course {
            _id: ID!
            subject: String!
            courseNum: String!
            courseName: String!
            weighted: Boolean!
            categories: [ID!]!
            creator: ID!
        }

        input CourseInput {
            subject: String!
            courseNum:  Float!
            courseName: String!
            weighted: Boolean!
            creator: ID!
        }

        type Category {
            _id: ID!
            name: String!
            weight: Float!
            elements: [ID!]!
            courseID: ID!
        }

        input CategoryInput {
            name: String!
            weight: Float!
            courseID: ID!
        }

        type CategoryElement {
            _id: ID!
            name: String!
            score: Float!
            total: Float!
            dueDate: String!
            categoryID: ID!
        }

        input CategoryElementInput {
            name: String!
            score: Float!
            total: Float!
            dueDate: String!
            categoryID: ID!
        }

        type RootQuery {
            loginUser(email: String!, password: String!): User
            courses(courseIDS: [ID!]!): [Course!]!
            categories(categoryIDS: [ID!]!): [Category!]!
            categoryElements(categoryElementIDS: [ID!]!): [CategoryElement!]!
        }

        type RootMutation {
            createUser(userInput: UserInput!): User
            createCourse(courseInput: CourseInput!): Course
            createCategory(categoryInput: CategoryInput!): Category
            createCategoryElement(categoryElementInput: CategoryElementInput!): CategoryElement

            editUser(userInput: UserInput!, userID: ID!): User
            editCourse(courseInput: CourseInput!, courseID: ID!): Course
            editCategory(categoryInput: CategoryInput!, categoryID: ID!): Category
            editCategoryElement(categoryElementInput: CategoryElementInput!, categoryElementID: ID!): CategoryElement

            deleteUser(userID: ID!): Boolean
            deleteCourse(courseID: ID!): User
            deleteCategory(categoryID: ID!): Course
            deleteCategoryElement(categoryElementID: ID!): Category
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        loginUser: loginUser,
        createUser: createUser,
        editUser: editUser,
        deleteUser: deleteUser,

        courses: getCourses,
        createCourse: createCourse,
        editCourse: editCourse,
        deleteCourse: deleteCourse,
        
        categories: getCategories,
        createCategory: createCategory,
        editCategory: editCategory,
        deleteCategory: deleteCategory,
        
        categoryElements: getCategoryElements,
        createCategoryElement: createCategoryElement,
        editCategoryElement: editCategoryElement,
        deleteCategoryElement: deleteCategoryElement
    },
    graphiql: true
}));

module.exports = app;

const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/user');
const Course = require('./models/course');
const Category = require('./models/category');
const CategoryElement = require('./models/categoryElement');

const { getUsers, createUser, editUser } = require('./modules/users');
const { getCourses, createCourse, editCourse } = require('./modules/courses');
const { getCategories, createCategory, editCategory, deleteCategory } = require('./modules/categories');
const { getCategoryElements, createCategoryElement, editCategoryElement, deleteCategoryElement } = require('./modules/categoryElements');

const app = express();

app.use(bodyParser.json());

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
            users: [User!]!
            courses: [Course!]!
            categories: [Category!]!
            categoryElements: [CategoryElement!]!
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
        users: getUsers,
        createUser: createUser,
        editUser: editUser,

        courses: getCourses,
        createCourse: createCourse,
        editCourse: editCourse,
        deleteCourse: async rawArgs => {
            let courseID = rawArgs.courseID;
    
            return Course.findById(courseID).then(async course => {
                if (!course) {
                    throw new Error("Course not found.");
                }
    
                let creatorID = course.creator;
                let categoryIDS = course.categories;
                categoryIDS.map(categoryID => deleteCategory({ categoryID: categoryID }));
                
                return Course.deleteOne({ _id: courseID }).then(async _ => {
                    return User.findById(creatorID).then(async user => {
                        user.courses.pull({ _id: courseID });
                        return user.save();
                    })
                    .then(result => {
                        return { ...result._doc };
                    });
                });
            })
            .catch(err => {
                throw err;
            });
        },
        
        categories: getCategories,
        createCategory: createCategory,
        editCategory: editCategory,
        deleteCategory: async rawArgs => {
            let categoryID = rawArgs.categoryID;
    
            return Category.findById(categoryID).then(async category => {
                if (!category) {
                    throw new Error("Category not found.");
                }
    
                let courseID = category.courseID;
                let categoryElementIDS = category.elements;
                categoryElementIDS.map(categoryElemID => deleteCategoryElement({ categoryElementID: categoryElemID }));
                
                return Category.deleteOne({ _id: categoryID }).then(async _ => {
                    return Course.findById(courseID).then(async course => {
                        course.categories.pull({ _id: categoryID });
                        return course.save();
                    })
                    .then(result => {
                        return { ...result._doc };
                    });
                });
            })
            .catch(err => {
                throw err;
            });
        },
        
        categoryElements: getCategoryElements,
        createCategoryElement: createCategoryElement,
        editCategoryElement: editCategoryElement,
        deleteCategoryElement: deleteCategoryElement
    },
    graphiql: true
}));

mongoose.connect(`
    mongodb+srv://${process.env.MONGO_USER}:${
        process.env.MONGO_PASSWORD
    }@academic-calendar-fzvdf.mongodb.net/${
        process.env.MONGO_DB
    }?retryWrites=true&w=majority
`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    app.listen(3000);
}).catch(err => {
    console.log(err);
});


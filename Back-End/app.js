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
        categories: async () => {
            try {
                const categories = await Category.find();
                return categories.map(category => {
                    return { ...category._doc };
                });
            } catch(err) {
                throw err;
            }
        },
        createCategory: async rawArgs => {
            let args = rawArgs.categoryInput;
            let newCategory = new Category({
                name: args.name,
                weight: args.weight,
                elements: [],
                courseID: args.courseID
            });

            return Course.findById(args.courseID).populate('categories')
            .then(course => {
                if (!course) {
                    throw new Error('Course does not exist.');
                }
                
                const filteredCategories = course.categories.filter(category => (
                    category.name === args.name &&
                    category.weight === args.weight
                ));

                if (filteredCategories.length > 0) {
                    throw new Error('Category already exists.');
                }

                return newCategory.save();
            }).then(async result => {
                return Course.findById(args.courseID);
            }).then(course => {
                course.categories.push(newCategory);
                return course.save();
            }).then(result => {
                return newCategory;
            }).catch(err => {
                throw err;
            });
        },
        editCategory: async rawArgs => {
            let args = rawArgs.categoryInput;
            return Category.findById(rawArgs.categoryID).then(async category => {
                if (!category) {
                    throw new Error("Cannot find category.");
                }

                return Category.findOne({
                    name: args.name,
                    weight: args.weight,
                    courseID: args.courseID
                })
                .then(foundCategory => {
                    if (foundCategory) {
                        throw new Error("Category already exists.");
                    }

                    category.name = args.name;
                    category.weight = args.weight;
                    return category.save();
                })
                .then(result => {
                    return { ...result._doc };
                });
            })
            .catch(err => {
                throw err;
            });
        },
        categoryElements: async () => {
            try {
                const categoryElements = await CategoryElement.find();
                return categoryElements.map(categoryElement => {
                    return { ...categoryElement._doc };
                });
            } catch(err) {
                throw err;
            }
        },
        createCategoryElement: async rawArgs => {
            let args = rawArgs.categoryElementInput;
            let newCategoryElement = new CategoryElement({
                name: args.name,
                score: args.score,
                total: args.total,
                dueDate: args.dueDate,
                categoryID: args.categoryID
            });

            return Category.findById(args.categoryID).populate('elements')
            .then(category => {
                if (!category) {
                    throw new Error('Category does not exist.');
                }
                
                const filteredCategoryElements = category.elements.filter(categoryElement => (
                    categoryElement.name === args.name
                ));

                if (filteredCategoryElements.length > 0) {
                    throw new Error('Category Element already exists.');
                }

                return newCategoryElement.save();
            }).then(async result => {
                return Category.findById(args.categoryID);
            }).then(category => {
                category.elements.push(newCategoryElement);
                return category.save();
            }).then(result => {
                return newCategoryElement;
            }).catch(err => {
                throw err;
            });
        },
        editCategoryElement: async rawArgs => {
            let args = rawArgs.categoryElementInput;
            return CategoryElement.findById(rawArgs.categoryElementID).then(async categoryElement => {
                if (!categoryElement) {
                    throw new Error("Category Element not found.");
                }

                return CategoryElement.findOne({
                    name: args.name,
                    categoryID: args.categoryID
                })
                .then(foundCategoryElement => {
                    if (foundCategoryElement) {
                        throw new Error("Category Element exists already.");
                    }

                    categoryElement.name = args.name;
                    categoryElement.score = args.score;
                    categoryElement.total = args.total;
                    categoryElement.dueDate = args.dueDate;

                    return categoryElement.save();
                })
                .then(result => {
                    return { ...result._doc };
                });
            })
            .catch(err => {
                throw new err;
            });
        }
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


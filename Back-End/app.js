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
        users: async () => {
            try {
                const users = await User.find();
                return users.map(user => {
                    return { ...user._doc };
                });
            }
            catch (err) {
                throw err;
            }
        },
        createUser: async rawArgs => {
            const args = rawArgs.userInput;
            return User.findOne({email: args.email}).then(user => {
                if (user) {
                    throw new Error('User exists already.');
                }
                return bcrypt.hash(args.password, 12);
            })
            .then(async hashedPassword => {
                const newUser = new User({
                    name: args.name,
                    email: args.email,
                    password: hashedPassword,
                    courses: []
                });
                
                try {
                    const result = await newUser.save();
                    return { ...result._doc, password: null };
                }
                catch (err) {
                    throw err;
                }
            }).catch(err => {
                throw err;
            });
        },
        editUser: async rawArgs => {
            let args = rawArgs.userInput;
            return bcrypt.hash(args.password, 12).then(async hashedPassword => {
                return User.findById(rawArgs.userID)
                .then(async user => {
                    if (!user) {
                        throw new Error("Cannot find user.");
                    }

                    const oldEmail = user.email;
                    user.name = args.name;
                    user.email = args.email;
                    user.password = hashedPassword;

                    if (oldEmail !== args.email) {
                        return User.findOne({ email: args.email })
                        .then(foundUser => {
                            if (foundUser) {
                                throw new Error("User with that email exists.");
                            }
                            return user.save();
                        });
                    }
                    return user.save();
                })
                .then(result => {
                    return { ...result._doc, password: null };
                });
            })
            .catch(err => {
                throw err;
            });
        },
        courses: async () => {
            try {
                const courses = await Course.find();
                return courses.map(course => {
                    return { ...course._doc };
                });
            } catch(err) {
                throw err;
            }
        },
        createCourse: async rawArgs => {
            let args = rawArgs.courseInput;
            let newCourse = new Course({
                subject: args.subject,
                courseNum: args.courseNum,
                courseName: args.courseName,
                weighted: args.weighted,
                categories: [],
                creator: args.creator
            });

            return Course.findOne({
                subject: args.subject,
                courseNum: args.courseNum,
                courseName: args.courseName,
                weighted: args.weighted,
                creator: args.creator
            }).then(course => {
                if (course) {
                    throw new Error('Course exists already.');
                }

                return newCourse.save();
            }).then(async result => {
                return User.findById(args.creator);
            }).then(user => {
                user.courses.push(newCourse);
                return user.save();
            }).then(result => {
                return newCourse;
            }).catch(err => {
                throw err;
            });
        },
        editCourse: async rawArgs => {
            let args = rawArgs.courseInput;
            return Course.findById(rawArgs.courseID).then(async course => {
                if (!course) {
                    throw new Error("Cannot find course.");
                }

                return Course.findOne({
                    subject: args.subject,
                    courseNum: args.courseNum,
                    courseName: args.courseName,
                    weighted: args.weighted,
                    creator: args.creator
                }).then(foundCourse => {
                    if (foundCourse) {
                        throw new Error('Course exists already.');
                    }
                    
                    course.subject = args.subject;
                    course.courseNum = args.courseNum;
                    course.courseName = args.courseName;
                    course.weighted = args.weighted;

                    return course.save();
                })
                .then(result => {
                    return { ...result._doc };
                });
            })
            .catch(err => {
                throw err;
            });
        },
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


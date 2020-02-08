const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/user');

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
                    password: hashedPassword
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


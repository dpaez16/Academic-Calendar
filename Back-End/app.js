const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use('/ac', graphQLHttp({
    schema: buildSchema(`
        type User {
            _id: ID!
            name: String!
            email: String!
            password: String!
        }

        input UserInput {
            name: String!
            email: String!
            password: String!
        }

        type RootQuery {
            users: [User!]!
        }

        type RootMutation {
            createUser(userInput: UserInput!): User
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
            const user = new User({
                name: args.name,
                email: args.email,
                password: args.password
            });
            
            try {
                const result = await user.save();
                return { ...result._doc };
            }
            catch (err) {
                throw err;
            }
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


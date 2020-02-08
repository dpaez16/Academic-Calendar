const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const users = [];

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
            createUser(userInput: UserInput!): Int
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        users: () => {
            return users;
        },
        createUser: rawArgs => {
            const args = rawArgs.userInput;
            const user = {
                _id: Math.random.toString(),
                name: args.name,
                email: args.email,
                password: args.password
            };

            users.push(user);
            return 0;
        }
    },
    graphiql: true
}));

app.listen(3000);
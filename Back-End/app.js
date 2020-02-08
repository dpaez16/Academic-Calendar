const express = require('express');
const bodyParser = require('body-parser');
const graphQLHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

app.use(bodyParser.json());

app.use('/ac', graphQLHttp({
    schema: buildSchema(`
        type RootQuery {
            users: [String!]!
        }

        type RootMutation {
            createUser(name: String, email: String, password: String): String
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        users: () => {
            return ['Danny Paez', 'Alex Paez'];
        },
        createUser: (args) => {
            const { name, email, password } = args;
            console.log(name);
            console.log(email);
            console.log(password);

            return "Done!";
        }
    },
    graphiql: true
}));

app.listen(3000);
const mongoose = require('mongoose');
const DB_URL =  `mongodb+srv://${process.env.MONGO_USER}:` + 
                `${process.env.MONGO_PASSWORD}@` + 
                `${process.env.MONGO_CLUSTER_DOMAIN}/` + 
                `${process.env.MONGO_DB}?retryWrites=true&w=majority`;

function dbConnect() {
    mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return mongoose.connection;
}

function dbClose() {
    return mongoose.disconnect();
}

module.exports = { dbConnect, dbClose }
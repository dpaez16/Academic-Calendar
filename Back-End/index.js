const app = require('./app');
const { dbConnect } = require('./db');
const PORT = process.env.PORT || 5000;


dbConnect().then(_ => {
    app.listen(PORT, _ => {
        console.log(`Listening on port: ${PORT}`);
    });
}).catch((err) => {
    console.log(err);
});
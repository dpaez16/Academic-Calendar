const User = require('../models/user');
const { editUser } = require('./users');

getRandomPassword = function() {
    const RANDOM_PW_LENGTH = 256;
    const LOWER_BOUND = 33;
    const UPPER_BOUND = 126;
    const length = UPPER_BOUND - LOWER_BOUND;
    
    let pw = "";

    for (let i = 0; i < RANDOM_PW_LENGTH; i++) {
        const num = Math.floor(LOWER_BOUND + Math.random() * length);
        pw += String.fromCharCode(num);
    }

    return pw;
};

module.exports = {
    forgotPassword: function(req, res) {
        const data = req.body;
        const { email } = data;

        if (!email) {
            return res.status(400).send({error: "Invalid email."});
        }

        User.findOne({email: email}).then(async foundUser => {
            if (!foundUser) {
                throw new Error('User not found with associated email.');
            }

            const userInput = {
                name: foundUser.name,
                email: foundUser.email,
                password: getRandomPassword()
            };
            const userID = foundUser._id;

            return editUser({ userInput: userInput, userID: userID });
        })
        .then((editedUser) => {
            return res.status(200).send({message: "Email has been sent!"});
        })
        .catch(err => {
            return res.status(400).send({error: err.message});
        });
    }
};

const User = require('../models/user');
const { editUser } = require('./users');
const sgMail = require('@sendgrid/mail');

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

sendEmail = function(email, pw) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msgComponents = ["Forgot Password", `We have resetted your password to ${pw}.`];
    const msg = {
        to: email,
        from: process.env.FORGOT_PASSWORD_SENDER_EMAIL,
        subject: 'Forgot Password',
        text: msgComponents.join("\n\n"),
        html: `<h1>${msgComponents[0]}</h1>\n<p>${msgComponents[1]}</p>`
    };

    return sgMail.send(msg);
};

module.exports = {
    forgotPassword: function(req, res) {
        const data = req.body;
        const { email } = data;
        const newPassword = getRandomPassword();

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
                password: newPassword
            };
            const userID = foundUser._id;

            return editUser({ userInput: userInput, userID: userID });
        })
        .then((_) => {
            return sendEmail(email, newPassword);
        })
        .then((_) => {
            return res.status(200).send({message: "Email has been sent!"});
        })
        .catch(err => {
            return res.status(400).send({error: err.message});
        });
    }
};

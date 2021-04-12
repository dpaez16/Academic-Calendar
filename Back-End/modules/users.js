const User = require('../models/user');
const { deleteCourse } = require('./courses');
const bcrypt = require('bcryptjs');

module.exports = {
    loginUser: async rawArgs => {
        let { email, password } = rawArgs;
        return User.findOne({email: email}).then(async foundUser => {
            if (!foundUser) {
                throw new Error('User not found.');
            }

            return bcrypt.compare(password, foundUser.password).then(isMatch => {
                if (isMatch) {
                    return {...foundUser._doc, password: null};
                } else {
                    throw new Error('Password is incorrect.');
                }
            });
        })
        .catch(err => {
            throw err;
        });
    },
    createUser: async rawArgs => {
        const args = rawArgs.userInput;
        return User.findOne({email: args.email}).then(async user => {
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
            
            return newUser.save();
        })
        .then((result) => {
            return { ...result._doc, password: null };
        })
        .catch(err => {
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
    deleteUser: async rawArgs => {
        let userID = rawArgs.userID;

        return User.findById(userID).then(async user => {
            if (!user) {
                throw new Error("User not found.");
            }

            let courseIDS = user.courses;
            let deletedResults = courseIDS.map(async courseID => await deleteCourse({ courseID: courseID }));

            return Promise.all(deletedResults);
        })
        .then((res) => {
            return User.deleteOne({ _id: userID });
        })
        .then((res) => {
            return true;
        })
        .catch(err => {
            throw err;
        });
    }
}
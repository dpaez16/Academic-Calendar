const User = require('../models/user');

module.exports = {
    getUsers: async () => {
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
    }
}
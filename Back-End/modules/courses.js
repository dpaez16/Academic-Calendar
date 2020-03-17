const Course = require('../models/course');

module.exports = {
    getCourses: async () => {
        try {
            const courses = await Course.find();
            return courses.map(course => {
                return { ...course._doc };
            });
        } catch(err) {
            throw err;
        }
    },
    createCourse: async rawArgs => {
        let args = rawArgs.courseInput;
        let newCourse = new Course({
            subject: args.subject,
            courseNum: args.courseNum,
            courseName: args.courseName,
            weighted: args.weighted,
            categories: [],
            creator: args.creator
        });

        return Course.findOne({
            subject: args.subject,
            courseNum: args.courseNum,
            courseName: args.courseName,
            weighted: args.weighted,
            creator: args.creator
        }).then(course => {
            if (course) {
                throw new Error('Course exists already.');
            }

            return newCourse.save();
        }).then(async result => {
            return User.findById(args.creator);
        }).then(user => {
            user.courses.push(newCourse);
            return user.save();
        }).then(result => {
            return newCourse;
        }).catch(err => {
            throw err;
        });
    },
    editCourse: async rawArgs => {
        let args = rawArgs.courseInput;
        return Course.findById(rawArgs.courseID).then(async course => {
            if (!course) {
                throw new Error("Cannot find course.");
            }

            return Course.findOne({
                subject: args.subject,
                courseNum: args.courseNum,
                courseName: args.courseName,
                weighted: args.weighted,
                creator: args.creator
            }).then(foundCourse => {
                if (foundCourse) {
                    throw new Error('Course exists already.');
                }
                
                course.subject = args.subject;
                course.courseNum = args.courseNum;
                course.courseName = args.courseName;
                course.weighted = args.weighted;

                return course.save();
            })
            .then(result => {
                return { ...result._doc };
            });
        })
        .catch(err => {
            throw err;
        });
    }
}
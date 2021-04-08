const Course = require('../models/course');
const User = require('../models/user');
const { deleteCategory } = require('./categories');

module.exports = {
    getCourses: async rawArgs => {
        let courseIDS = rawArgs.courseIDS;
        try {
            const courses = await courseIDS.map(async courseID => {
                return Course.findById(courseID).then(course => {
                    if (!course) {
                        throw new Error('Course not found.');
                    }

                    return { ...course._doc };
                });
            });

            return courses;
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
    },
    deleteCourse: async rawArgs => {
        let courseID = rawArgs.courseID;

        return Course.findById(courseID).then(async course => {
            if (!course) {
                throw new Error("Course not found.");
            }

            let creatorID = course.creator;
            let categoryIDS = course.categories;
            categoryIDS.map(categoryID => deleteCategory({ categoryID: categoryID }));
            
            return Course.deleteOne({ _id: courseID }).then(async _ => {
                return User.findById(creatorID).then(async user => {
                    user.courses.pull({ _id: courseID });
                    return user.save();
                })
                .then(result => {
                    return { ...result._doc };
                });
            });
        })
        .catch(err => {
            throw err;
        });
    }
}
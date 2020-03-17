const Category = require('../models/category');
const Course = require('../models/course');


module.exports = {
    getCategories: async () => {
        try {
            const categories = await Category.find();
            return categories.map(category => {
                return { ...category._doc };
            });
        } catch(err) {
            throw err;
        }
    },
    createCategory: async rawArgs => {
        let args = rawArgs.categoryInput;
        let newCategory = new Category({
            name: args.name,
            weight: args.weight,
            elements: [],
            courseID: args.courseID
        });

        return Course.findById(args.courseID).populate('categories')
        .then(course => {
            if (!course) {
                throw new Error('Course does not exist.');
            }
            
            const filteredCategories = course.categories.filter(category => (
                category.name === args.name &&
                category.weight === args.weight
            ));

            if (filteredCategories.length > 0) {
                throw new Error('Category already exists.');
            }

            return newCategory.save();
        }).then(async result => {
            return Course.findById(args.courseID);
        }).then(course => {
            course.categories.push(newCategory);
            return course.save();
        }).then(result => {
            return newCategory;
        }).catch(err => {
            throw err;
        });
    },
    editCategory: async rawArgs => {
        let args = rawArgs.categoryInput;
        return Category.findById(rawArgs.categoryID).then(async category => {
            if (!category) {
                throw new Error("Cannot find category.");
            }

            return Category.findOne({
                name: args.name,
                weight: args.weight,
                courseID: args.courseID
            })
            .then(foundCategory => {
                if (foundCategory) {
                    throw new Error("Category already exists.");
                }

                category.name = args.name;
                category.weight = args.weight;
                return category.save();
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
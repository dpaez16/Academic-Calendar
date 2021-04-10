const Category = require('../models/category');
const Course = require('../models/course');


module.exports = {
    getCategories: async rawArgs => {
        let categoryIDS = rawArgs.categoryIDS;
        const categories = categoryIDS.map(async categoryID => {
            return Category.findById(categoryID).then(category => {
                if (!category) {
                    throw new Error('Category not found.');
                }

                return { ...category._doc };
            });
        });

        return Promise.all(categories)
        .then((categories) => {
            return categories;
        }).catch((err) => {
            throw err;
        });
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
    },
    deleteCategory: async rawArgs => {
        let categoryID = rawArgs.categoryID;

        return Category.findById(categoryID).then(async category => {
            if (!category) {
                throw new Error("Category not found.");
            }

            let courseID = category.courseID;
            let categoryElementIDS = category.elements;
            categoryElementIDS.map(categoryElemID => deleteCategoryElement({ categoryElementID: categoryElemID }));
            
            return Category.deleteOne({ _id: categoryID }).then(async _ => {
                return Course.findById(courseID).then(async course => {
                    course.categories.pull({ _id: categoryID });
                    return course.save();
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
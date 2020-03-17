const CategoryElement = require('../models/categoryElement');
const Category = require('../models/category');

module.exports = {
    getCategoryElements: async () => {
        try {
            const categoryElements = await CategoryElement.find();
            return categoryElements.map(categoryElement => {
                return { ...categoryElement._doc };
            });
        } catch(err) {
            throw err;
        }
    },
    createCategoryElement: async rawArgs => {
        let args = rawArgs.categoryElementInput;
        let newCategoryElement = new CategoryElement({
            name: args.name,
            score: args.score,
            total: args.total,
            dueDate: args.dueDate,
            categoryID: args.categoryID
        });

        return Category.findById(args.categoryID).populate('elements')
        .then(category => {
            if (!category) {
                throw new Error('Category does not exist.');
            }
            
            const filteredCategoryElements = category.elements.filter(categoryElement => (
                categoryElement.name === args.name
            ));

            if (filteredCategoryElements.length > 0) {
                throw new Error('Category Element already exists.');
            }

            return newCategoryElement.save();
        }).then(async result => {
            return Category.findById(args.categoryID);
        }).then(category => {
            category.elements.push(newCategoryElement);
            return category.save();
        }).then(result => {
            return newCategoryElement;
        }).catch(err => {
            throw err;
        });
    },
    editCategoryElement: async rawArgs => {
        let args = rawArgs.categoryElementInput;
        return CategoryElement.findById(rawArgs.categoryElementID).then(async categoryElement => {
            if (!categoryElement) {
                throw new Error("Category Element not found.");
            }

            return CategoryElement.findOne({
                name: args.name,
                categoryID: args.categoryID
            })
            .then(foundCategoryElement => {
                if (foundCategoryElement) {
                    throw new Error("Category Element exists already.");
                }

                categoryElement.name = args.name;
                categoryElement.score = args.score;
                categoryElement.total = args.total;
                categoryElement.dueDate = args.dueDate;

                return categoryElement.save();
            })
            .then(result => {
                return { ...result._doc };
            });
        })
        .catch(err => {
            throw new err;
        });
    }
}
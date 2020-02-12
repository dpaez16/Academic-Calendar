const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categoryElementSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    categoryID: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

module.exports = mongoose.model('CategoryElement', categoryElementSchema);
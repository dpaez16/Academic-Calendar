const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    elements: [
        {
            type: Schema.Types.ObjectId,
            ref: 'CategoryElement'
        }
    ],
    courseID: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
});

module.exports = mongoose.model('Category', categorySchema);
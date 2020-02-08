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
        ref: 'Course'
    }
});

module.exports = mongoose.model('Category', categorySchema);
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const courseSchema = new Schema({
    subject: {
        type: String,
        required: true
    },
    courseNum: {
        type: Number,
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    weighted: {
        type: Boolean,
        required: true
    },
    categories: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Category'
        }
    ],
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Course', courseSchema);
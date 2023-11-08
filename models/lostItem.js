const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for lost items
const lostItemSchema = new Schema({
    title:{
        type: 'string',
        required: true
    },
    description:{
        type: 'string',
        required: true
    },
    category: {
        type: 'string',
        required: true
    },
    location: {
        type: 'string',
        required: true
    },
    isLost: {
        type: 'boolean',
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model for lost items using the schema
const LostItem = mongoose.model('LostItem', lostItemSchema);

module.exports = LostItem;
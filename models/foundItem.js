const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for found items
const foundItemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    isLost: {
        type: Boolean,
        default: false
    }, // Indicates that it's a found item
    createdAt: {
        type: Date,
        default: Date.now
    },
});

// Create a model for found items using the schema
const FoundItem = mongoose.model('FoundItem', foundItemSchema);

module.exports = FoundItem;
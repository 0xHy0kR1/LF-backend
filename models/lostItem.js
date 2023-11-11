const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for lost items
const lostItemSchema = new Schema({
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
    securityQuestion: {
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        required: true,
    },
    notifications: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          message: String,
          isRead: {
            type: Boolean,
            default: false,
          },
        },
      ],
    isLost: {
        type: Boolean,
        default: true
    }, // Indicates that it's a lost item
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model for lost items using the schema
const LostItem = mongoose.model('LostItem', lostItemSchema);

module.exports = LostItem;

// In this file we make schema for users to store their information

const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,

    },
    timestamp: {
        type: Date,
        default: Date.now
    },

  });

// Create a model for users using the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
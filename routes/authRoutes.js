const express = require('express')
const User = require('../models/User'); // Import the User model
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router()
const bcrypt = require('bcrypt');


// ROUTE 1: Create a User using: POST "/api/auth/createuser". Doesn't require Auth
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({min: 3}),
    body('email', 'Enter a valid email').isEmail(),
    body('password').isLength({ min: 6 })
  ] , async (req, res) => {

    try{
        const {username, email, password} = req.body;

        // Check if the user is already registered
        const exisitingUser = await User.findOne({email})
        if(exisitingUser){
            return res.status(400).json({message: 'User already exists'});
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user account
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
  
        })
        await newUser.save();
        res.status(201).json({message: 'User registration successful'});
    }catch(error){
        console.error(error);
        res.status(400).json({message: 'User registration failed'});
    }

})

// ROUTE 2: Authenticate a User using: POST "/api/auth/login". no login required
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password Cannot be blank').exists(),
  ] , async (req, res) => {
    try{
        const {email, password} = req.body;

        // Find the user by email
        const user = await User.findOne({email: email});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        // Compare the password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password) //bcrypt.compare method returns true false as a result
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        // Generate a JWT token for authentication
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '12h'});
        res.json({token});
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Login Failed'});
    }

})

// ROUTE 3: Get loggedin a User Details: POST "/api/auth/authenticate". Login required
// Below we loggedin a user based on the provided authtoken
router.post('/authenticate', async (req, res) => {
    
    try{
        const token = req.body.token;
        if(!token){
            return res.status(401).json({message: 'Token not provided'});
        }

        // Verify the token and decode it to get user information 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded.userId){
            return res.status(401).json({message: 'Invalid token'});
        }

        // Find the user by their decoded user ID
        const user = await User.findById(decoded.userId);
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.json({user});
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Authentication failed'});
    }
})
module.exports = router;

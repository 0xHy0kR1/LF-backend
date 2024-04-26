const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {

    const token = req.headers.authorization.split(' ')[1];
    console.log('token', token);
    if(!token){
        return res.status(401).json({message: 'Access Denied. No authentication token provided.'});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if(!user){
            return res.status(401).json({message: 'Invalid authentication token'});
        }

        req.userId = user.id; // Add the user's ID to the request object
        next();
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Authentication Failed'});
    }
}

module.exports = authMiddleware;
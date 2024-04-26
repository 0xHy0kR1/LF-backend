// Import required library
const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors'); // Used for handling cross-origin requests
const morgan = require('morgan'); // Used for logging

connectToMongo(); // Connecting to MongoDB

// Create an Express application
const app = express();
const port = 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({limit: '50mb'}));

// Available Routes
app.use('/api/auth', require('./routes/authRoutes'));  //This response is shown when the user visit "http://localhost:5000/api/auth"
app.use('/api/lost-items', require('./routes/lostItemRoutes')); //This response is shown when the user visit "http://localhost:5000/api/lost-items"

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });  
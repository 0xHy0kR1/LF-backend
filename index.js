// Import required library
const express = require('express');

connectToMongo(); // Connecting to MongoDB

// Create an Express application
const app = express();
const port = 5000;

// Available Routes
app.use('/api/auth', require('./routes/auth'));  //This response is shown when the user visit "http://localhost:5000/api/auth"
app.use('/api/notes', require('./routes/notes'));

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });  
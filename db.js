require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose'); //Importing mongoose
const mongoURI = process.env.MONGO_URL;

const connectToMongo = async ()=>{
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected Successfully');
    } catch (error) {
        console.error(error);
    }
}

module.exports = connectToMongo; //Here, we export this function
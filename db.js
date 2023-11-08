const mongoose = require('mongoose'); //Importing mongoose
const mongoURI = process.env.REACT_APP_MONGO_URI;

const connectToMongo = async ()=>{
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected Successfully');
    } catch (error) {
        console.error(error);
    }
}

module.exports = connectToMongo; //Here, we export this function
const express = require('express');
const router = express.Router(); // Create a router(It defines a new router object )
const LostItem = require('../models/LostItem'); // Import the lostItem model
const authMiddleware = require('../middleware/authMiddleware'); // Custom authentication middleware
const User = require('../models/User');

// Route to create a new lost item
router.post('/create', authMiddleware, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
  
      const { title, description, category, location, securityQuestion  } = req.body;
      const newLostItem = new LostItem({
        title,
        description,
        category,
        location,
        securityQuestion,
        user: req.userId,
      });
      await newLostItem.save();
      res.status(201).json(newLostItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Item creation failed' });
    }
  });


// Route to list all lost items
router.get('/list', async(req, res)=>{
    try{
        const lostItems = await LostItem.find();
        res.json({lostItems: lostItems});
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to retrieve lost items'});
    }
})

// Route to update a specific lost item
router.put('/update/:itemId', authMiddleware, async(req,res) => {
    try{
        const itemId = req.params.itemId; // Item ID from the route parameters
        const { title, description, category, location, securityQuestion } = req.body;

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem){
            return res.status(404).json({error: 'Lost item not found'});
        }

        // Check if the user making the update is the owner of the lost item
        if(lostItem.user.toString() !== req.userId){
            return res.status(403).json({error: 'Permission denied'});
        }

        // Update the Item's properties as needed
        if(title){
            lostItem.title = title;
        }
        if(description){
            lostItem.description = description;
        }
        if(category){
            lostItem.category = category;
        }
        if(location){
            lostItem.location = location;
        }
        if(securityQuestion){
            lostItem.securityQuestion = securityQuestion;
        }
        
        // Save the updated Item
        await lostItem.save();

        res.json(lostItem);
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to update the lost item'});
    }
})

// Route to delete a specific lost item
router.delete('/delete/:itemId', authMiddleware, async(req, res) => {

    try{
        const itemId = req.params.itemId; // Item ID from the route parameters

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem){
            return res.status(404).json({error: 'Lost item not found'});
        }

        // Check if the user making the delete is the owner of the lost item
        if(lostItem.user.toString() !== req.userId){
            return res.status(403).json({error: 'Permission denied'});
        }
        
        // Delete the item
        await lostItem.deleteOne();

        res.json({message: 'Item deleted successfully'});
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to delete the lost item'});
    }
})

// Route to view a specific lost item
router.get('/view/:itemId', async(req, res) => {
    try{
        const itemId = req.params.itemId; // Item ID from the route parameters

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem){
            return res.status(404).json({error: 'lost Item not found'});
        }

        res.json(lostItem);
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to retrieve the lost item'});
    }
})

// Route to view a specific lost item
router.get('/view/:itemId', async (req, res) => {

    try{
        const itemId = req.params.itemId; // Item ID from the route parameters

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem) {
            return res.status(404).json({error: 'Lost item Not Found'});
        }

        // Check if the user needs to answer a security question
        if(lostItem.securityQuestion){
            // You may want to send the security question to the client for them to answer before revealing detailed information
            return res.json({securityQuestion: lostItem.securityQuestion.question });
        }

        // If no security question, provide detailed information
        const user = await User.findById(lostItem.user);
        if(!user){
            return res.status(404).json({error: 'User not found'});
        }

        const {email} = user;
        res.json({email: email});
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to retrieve lost item'});
    }
});

// Route to submit the answer to the security question
router.post('/answerSecurityQuestion/:itemId', async (req, res) => {

    try{
        const itemId = req.params.itemId;
        const answer = req.body;

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem){
            return res.status(404).json({error: 'Lost item not found'});
        }

        if(!lostItem.securityQuestion || answer !== lostItem.securityQuestion.answer){
            return res.status(401).json({error: 'Incorrect answer'});
        }

        // If the answer is correct, provide detailed information
        const user = await User.findById(lostItem.user);
        if(!user){
            return res.status(404).json({error: 'User not found'});
        }

        const {email} = user;
        res.json({email});
    }catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to submit the answer'});
    }
});


module.exports = router;
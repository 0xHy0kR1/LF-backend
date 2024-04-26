const express = require('express');
const router = express.Router(); // Create a router(It defines a new router object )
const LostItem = require('../models/lostItem'); // Import the lostItem model
const authMiddleware = require('../middleware/authMiddleware'); // Custom authentication middleware
const User = require('../models/User');
const multer = require('multer'); 
const sharp = require('sharp');
// import { S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");

// The below help us to create hex file name for files using crpto library
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const storage = multer.memoryStorage({
    // Set a higher limit for image file size
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB
    },
});

const upload = multer({ storage: storage })


const bucketName = process.env.BUCKET_NAME 
const bucketRegion = process.env.BUCKET_REGION 
const accessKey = process.env.ACCESS_KEY 
const secretAccessKey = process.env.SECRET_ACCESS_KEY

// Creating a new s3 object
const s3 = new S3Client({
    credentials: {
      accessKeyId: accessKey, 
      secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
  });

// ROUTE 1: Add a new lost item using: POST "/api/lost-items/create". login required
router.post('/create', authMiddleware, upload.single("image"), async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // resize image
      const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit: "inside"}).toBuffer();
      const { title, description, category, location, securityQuestion: securityQuestionJson } = req.body;
      // Parse the securityQuestion JSON string
      const securityQuestion = JSON.parse(securityQuestionJson);

      const randomeimgName = randomImageName();
      const params = {
        Bucket: bucketName,
        Key: randomeimgName,
        Body: buffer,
        ContentType: req.file.mimetype
      }

      const command = new PutObjectCommand(params)

      await s3.send(command);
      const newLostItem = new LostItem({
        title,
        description,
        category,
        location,
        securityQuestion,
        user: req.userId,
        image: randomeimgName,
      });
      await newLostItem.save();
      res.status(201).json(newLostItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Item creation failed' });
    }
  });


// ROUTE 2: Get All lost items using: GET "/api/lost-items/list". login required
router.get('/list-lostItems', async(req, res)=>{


    try {
        const lostItems = await LostItem.find();

        // Generate pre-signed URLs for each image
        const itemsWithUrls = [];
        for (const item of lostItems) {
            if (!item.image) {
                console.error('Image not found for item:', item);
                continue;
            }
            const getObjectParams = {
                Bucket: bucketName,
                Key: item.image,
            };
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

            itemsWithUrls.push({
                ...item.toObject(),
                imageUrl: url,
            });
        }

        res.json({ lostItems: itemsWithUrls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve lost items' });
    }
})

// ROUTE 3: Update a specific lost item using: PUT "/api/lost-items/update/:itemId". login required
router.put('/update/:itemId', upload.single("image") , authMiddleware, async(req,res) => {
    try{
        const itemId = req.params.itemId; // Item ID from the route parameters
        const { title, description, category, location, securityQuestion } = req.body;
        const lostItem = await LostItem.findById(itemId);

        // Generate a new random image name
        const newImgName = randomImageName();

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
        // Parse the securityQuestion JSON string if provided
        if (securityQuestion) {
            try {
                lostItem.securityQuestion = JSON.parse(securityQuestion);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid JSON format for securityQuestion' });
            }
        }
        // Check if a new image file is provided
        if(req.file){
            // Delete the old image from S3
            const deleteparams = {
                Bucket: bucketName,
                Key: lostItem.image
            }

            const deleteCommand = new DeleteObjectCommand(deleteparams);
            await s3.send(deleteCommand);
            
            // Resize the new image file if needed
            const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit: "inside"}).toBuffer();

            // Upload the new image to S3
            const params = {
                Bucket: bucketName,
                Key: newImgName,
                Body: buffer,
                ContentType: req.file.mimetype,
            };

            const uploadCommand = new PutObjectCommand(params);
            await s3.send(uploadCommand);

            // Update the image field with the new image name
            lostItem.image = newImgName;
        }
        
        // Save the updated Item
        await lostItem.save();

        res.json(lostItem);
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to update the lost item'});
    }
})

// ROUTE 4: Delete a specific lost item using: DELETE "/api/lost-items/delete/:itemId". login required
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
        // Delete the old image from S3
        const deleteparams = {
            Bucket: bucketName,
            Key: lostItem.image
        }

        const deleteCommand = new DeleteObjectCommand(deleteparams);
        await s3.send(deleteCommand);

        // Delete the item from database
        await lostItem.deleteOne();

        res.json({success: true, message: 'Item deleted successfully'});
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: `Failed to delete the lost item: ${error.message}` });
    }
})

// ROUTE 5: Route to view a specific lost item
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
        res.json({
            email: email,
            itemName: lostItem.title,
            description: lostItem.description,
            category: lostItem.category,
            location: lostItem.location,
            imageUrl: lostItem.imageUrl
        });
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to retrieve lost item'});
    }
});

// ROUTE 6: Route to submit the answer to the security question
router.post('/answerSecurityQuestion/:itemId', async (req, res) => {

    try{
        console.log("req value inside backend answer func: "+req);
        const itemId = req.params.itemId;
        const answer = req.body.securityQuestion.answer.toLowerCase();

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

        // Extract username from user object
        const { email } = user;

        // Add a new notification to user A's lost item
        lostItem.notifications.push({
            userId: user._id,
            message: `Someone answered your question!`,
        });

        // Save the updated lost item
        await lostItem.save();

        res.json({
            email: email,
            itemName: lostItem.title,
            description: lostItem.description,
            category: lostItem.category,
            location: lostItem.location,
            imageUrl: lostItem.imageUrl,
            userId: lostItem.user,
        });
    }catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to submit the answer'});
    }
});

// ROUTE 7: Mark a specific lost item as found using: PUT "/api/lost-items/markAsFound/:itemId". login required
router.put('/markAsFound/:itemId', authMiddleware, async (req, res) => {
    try{
        const itemId = req.params.itemId; // Item ID from the route parameters

        const lostItem = await LostItem.findById(itemId);

        if(!lostItem){
            return res.status(404).json({error: 'Lost item not found'});
        }

        // Check if the user marking the item as found is the owner of the lost item
        if(lostItem.user.toString() !== req.userId){
            return res.status(403).json({error: 'Permission denied'});
        }

        // Update the status of the lost item as found
        lostItem.isLost = false;

        // Save the updated lost item
        await lostItem.save();

        res.json({success: true, message: 'Item marked as found successfully'});
    } catch (error){
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to mark the item as found'});
    }
});

// ROUTE 8: Get All found items using: GET "/api/lost-items/list-foundItems". login required
router.get('/list-foundItems', async(req, res)=>{


    try {
        const lostItems = await LostItem.find();

        // Generate pre-signed URLs for each image
        const itemsWithUrls = [];
        for (const item of lostItems) {
            if (!item.image) {
                console.error('Image not found for item:', item);
                continue;
            }
            const getObjectParams = {
                Bucket: bucketName,
                Key: item.image,
            };
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

            itemsWithUrls.push({
                ...item.toObject(),
                imageUrl: url,
            });
        }

        res.json({ lostItems: itemsWithUrls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve lost items' });
    }
})
module.exports = router;
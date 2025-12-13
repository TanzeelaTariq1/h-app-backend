import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import multer from "multer"; 
import streamifier from "streamifier";
import dotenv from 'dotenv';
 
dotenv.config();
const router = express.Router();

 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

//Multer setup using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
 

router.post("/", upload.single("image"), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Create a stream to upload the file to Cloudinary
        const uploadStream = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error , result)=>{
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                //use streamfier to convert buffer to stream
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };
        //Call the uploadStream function 
        const result  = await uploadStream(req.file.buffer);
        //Respond with the uploaded image URL
        res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Error uploading image" });
    }
});

//
export default router;

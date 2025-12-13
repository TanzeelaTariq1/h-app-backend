import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js'; // Import the connectDB function

import UserRoutes from './routes/UserRoutes.js'; // Import the UserRoutes
import UploadRoutes from './routes/UploadRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';

 

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 9000;
connectDB(); // Connect to MongoDB

app.get('/health', (req, res) => {
    res.send('Server Online!');
});


//Api routes
app.use('/api/users', UserRoutes); // Use the UserRoutes for /api/users
//app.use('/api/upload', UploadRoutes); //  
//app.use('/api/admin', AdminRoutes);


app.listen(PORT ,() => {
    console.log(`Server is running on port ${PORT}`);


});
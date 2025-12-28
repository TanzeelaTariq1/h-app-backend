import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Import all routes
import UserRoutes from './routes/UserRoutes.js';
import ComplaintsRoutes from './routes/ComplaintsRoutes.js';
import UploadRoutes from './routes/UploadRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import AlertRoutes from './routes/AlertsRoutes.js';
import EventRoutes from './routes/EventsRoutes.js';
import AnnouncementsRoutes from './routes/AnnouncementsRoutes.js';  // ✅ New
import PollsRoutes from './routes/PollsRoutes.js';                  // ✅ New

// Import admin specific routes
import AdminAlertsRoutes from './routes/admin/AdminAlertsRoutes.js';
import AdminEventsRoutes from './routes/admin/AdminEventsRoutes.js';
import AdminComplaintsRoutes from './routes/admin/AdminComplaintsRoutes.js';
import AdminAnnouncementsRoutes from './routes/admin/AdminAnnouncementsRoutes.js'; // ✅ New
import AdminPollsRoutes from './routes/admin/AdminPollsRoutes.js';                  // ✅ New

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 9608;

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/users', UserRoutes);
app.use('/api/complaints', ComplaintsRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/alerts', AlertRoutes);
app.use('/api/admin/alerts', AdminAlertsRoutes);  // ✅ Uncomment
app.use('/api/events', EventRoutes);
app.use('/api/admin/events', AdminEventsRoutes);
app.use('/api/admin/complaints', AdminComplaintsRoutes);
app.use('/api/announcements', AnnouncementsRoutes);    // ✅ User announcements view
app.use('/api/admin/announcements', AdminAnnouncementsRoutes); // ✅ Admin manage announcements
app.use('/api/polls', PollsRoutes);                    // ✅ User polls view/vote
app.use('/api/admin/polls', AdminPollsRoutes);         // ✅ Admin manage polls

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
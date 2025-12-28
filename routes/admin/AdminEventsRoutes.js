import express from 'express';
import { protect, admin } from '../../middleware/authMiddleware.js';
import Event from '../../models/Event.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Create event
router.post('/', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            date, 
            time, 
            location, 
            category, 
            imageUrl, 
            organizer, 
            maxParticipants 
        } = req.body;
        
        // Validation
        if (!title || !description || !date || !time || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, description, date, time, location'
            });
        }

        // Create event object
        const eventData = {
            title,
            description,
            date: new Date(date), // Convert to Date object
            time,
            location,
            createdBy: req.user._id
        };

        // Add optional fields if provided
        if (category) eventData.category = category;
        if (imageUrl) eventData.imageUrl = imageUrl;
        if (organizer) eventData.organizer = organizer;
        if (maxParticipants) eventData.maxParticipants = maxParticipants;

        const event = new Event(eventData);
        const createdEvent = await event.save();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event: createdEvent
        });
    } catch (error) {
        console.error('Create event error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({})
            .populate('createdBy', 'name email')
            .populate('registeredUsers', 'name email')
            .sort({ date: 1, createdAt: -1 })
            .select('-__v');
        
        res.json({
            success: true,
            events,
            count: events.length,
            message: 'Events retrieved successfully'
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('registeredUsers', 'name email')
            .select('-__v');
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event,
            message: 'Event retrieved successfully'
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update event
router.put('/:id', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            date, 
            time, 
            location, 
            category, 
            imageUrl, 
            organizer, 
            maxParticipants,
            isActive 
        } = req.body;
        
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Update fields
        if (title !== undefined) event.title = title;
        if (description !== undefined) event.description = description;
        if (date !== undefined) event.date = new Date(date);
        if (time !== undefined) event.time = time;
        if (location !== undefined) event.location = location;
        if (category !== undefined) event.category = category;
        if (imageUrl !== undefined) event.imageUrl = imageUrl;
        if (organizer !== undefined) event.organizer = organizer;
        if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
        if (isActive !== undefined) event.isActive = isActive;

        const updatedEvent = await event.save();

        res.json({
            success: true,
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Update event error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        await event.deleteOne();

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Toggle event active status
router.patch('/:id/toggle-active', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        event.isActive = !event.isActive;
        await event.save();

        res.json({
            success: true,
            message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: event.isActive
        });
    } catch (error) {
        console.error('Toggle active error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
import express from 'express';
import Event from '../models/Event.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all active events for users
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const currentDate = new Date();
        
        // Get upcoming events
        const upcomingEvents = await Event.find({
            isActive: true,
            date: { $gte: currentDate }
        })
        .sort({ date: 1, time: 1 })
        .populate('createdBy', 'name');

        // Get past events
        const pastEvents = await Event.find({
            isActive: true,
            date: { $lt: currentDate }
        })
        .sort({ date: -1 })
        .populate('createdBy', 'name')
        .limit(10);

        // Format events
        const formatEvent = (event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            const isToday = eventDate.toDateString() === now.toDateString();
            
            return {
                id: event._id,
                title: event.title,
                description: event.description,
                date: event.date,
                formattedDate: isToday ? 'Today' : eventDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }),
                time: event.time,
                location: event.location,
                category: event.category,
                organizer: event.organizer,
                createdBy: event.createdBy?.name || 'Admin'
            };
        };

        res.json({
            success: true,
            upcomingEvents: upcomingEvents.map(formatEvent),
            pastEvents: pastEvents.map(formatEvent),
            upcomingCount: upcomingEvents.length,
            pastCount: pastEvents.length
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                location: event.location,
                category: event.category,
                organizer: event.organizer,
                createdBy: event.createdBy?.name || 'Admin'
            }
        });

    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
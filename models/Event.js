import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    time: {
        type: String,
        required: [true, 'Event time is required']
    },
    location: {
        type: String,
        required: [true, 'Event location is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['celebration', 'meeting', 'cleanup', 'social', 'other'],
        default: 'other'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    organizer: {
        type: String,
        default: 'Colony Management'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxParticipants: {
        type: Number,
        default: 0 // 0 means no limit
    },
    registeredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
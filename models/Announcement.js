import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,  // Frontend format کے مطابق: "November 19"
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'in-progress', 'cancelled'],
        default: 'pending'
    },
    details: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['maintenance', 'security', 'facilities', 'events', 'rules', 'general'],
        default: 'general'
    },
    priority: {
        type: Number,
        enum: [1, 2, 3], // 1=High, 2=Medium, 3=Low
        default: 2
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
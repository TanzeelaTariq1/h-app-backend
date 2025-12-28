import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['facilities', 'maintenance', 'security', 'events', 'general'],
        default: 'general'
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        votes: {
            type: Number,
            default: 0
        },
        voters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    totalVotes: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiryDate: {
        type: Date
    },
    result: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
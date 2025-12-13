import mongoose from "mongoose";
import bcrypt from "bcryptjs";



const complainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phoneno: {
        type: Number,
        required: true,
        unique: true,

    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String, // URL of the uploaded image
        default: "",
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "resolved"],
        default: "pending",
    },


},
    { timestamps: true }

);



//export the user model
const Complain = mongoose.model("Complain", complainSchema);
export default Complain;
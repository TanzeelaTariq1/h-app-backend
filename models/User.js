import mongoose from "mongoose";
import bcrypt from "bcryptjs";
 


const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    address: {
        type: String,
        required: true,
       
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
},
    { timestamps: true }

);

// Hash password before saving to database
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
     
    next();
});


// Compare password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//export the user model
const User = mongoose.model("User", userSchema);
export default User;
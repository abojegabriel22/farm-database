import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { validate } from "swagger-parser"

const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function(v){
                // password must be at least 8 characters long and contain at least one number and one letter
                return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v)
            },
            message: "Password must be at least 8 characters long and contain at least one number and one letter"
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    auth: {
        type: Boolean,
        default: false
    },
    loginAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 60 * 1000)
    }
}, { timestamps: true })

registerSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
  }
  this.updatedAt = new Date(Date.now() + 60 * 60 * 1000);   // +1 hour
  next();
});

// hash password before saving 
registerSchema.pre('save', async function(next){
    if(!this.isModified("password")){
        return next()
    }
    try{
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch(err){
        next(err)
    }
})
// method to compare password
registerSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password)
}

const registerModel = mongoose.model("register", registerSchema)
export default registerModel
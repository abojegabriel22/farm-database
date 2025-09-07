import mongoose from "mongoose"

const loginSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "register",
        required: true
    },
    username: {
        type: String,
        required: true
    },
    loginAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 *60 *1000)
    }
})

const loginModel = mongoose.model("login", loginSchema)
export default loginModel

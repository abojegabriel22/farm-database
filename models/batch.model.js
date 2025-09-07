
import mongoose from "mongoose";
const batchSchema = new mongoose.Schema({
    //add ref to farm
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "register",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true,
        default: () => {
            const date = new Date();
            date.setHours(date.getHours() + 1); // add +1 hour
            return date;
        }
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active'
    },
    createAt: {
        type: Date,
        default: () => {
            const date = new Date();
            date.setHours(date.getHours() + 1); // add +1 hour
            return date;
        }
    }
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            delete ret.id
        }
    },
    toObject: {
        virtuals: true
    }
})
const batchModel = mongoose.model("batch", batchSchema)
export default batchModel
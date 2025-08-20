import mongoose from "mongoose";
const mortSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    totalMortalities: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date
    }
})
const mortModel = mongoose.model("mort", mortSchema)
export default mortModel
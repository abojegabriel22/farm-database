import mongoose from "mongoose"

const feedSumSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    totalQuantity: {
        type: Number,
        default: 0
    },
    totalPrices: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date
    }
})

const feedSumModel = mongoose.model("feedSum", feedSumSchema)
export default feedSumModel
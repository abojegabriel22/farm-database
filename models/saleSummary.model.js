
import mongoose from "mongoose"

const saleSummarySchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    totalNumSold: {
        type: Number,
        default: 0
    },
    totalSaleAmount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date
    }
})
const saleSummaryModel = mongoose.model("saleSummary", saleSummarySchema)
export default saleSummaryModel
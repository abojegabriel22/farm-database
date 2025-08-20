
import mongoose from "mongoose"
import router from "../routes/feeds.route"

const summarySchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchase",
        required: true,
        unique: true
    },
    totalSales: {
        type: Number,
        default: 0
    },
    capital: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    totalMortality: {
        type: Number,
        default: 0
    },
    totalFeeds: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    netProfit: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const summaryModel = mongoose.model("summary", summarySchema)
export default summaryModel
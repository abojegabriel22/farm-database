
import mongoose from "mongoose"
const totalVaccineSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    totalVaccineAmount: {
        type: Number,
        default: 0
    },
    dateUpdated: {
        type: Date
    }
})
const totalVaccineModel = mongoose.model("totalVaccine", totalVaccineSchema)
export default totalVaccineModel

import mongoose from "mongoose"

const mortalitySchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "batch",
        required: true
    },
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchase",
        required: true
    },
    mortalityRate: {
        type: Number,
        required: true
    },
    mortalityAge: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            delete ret.id
            if(ret.date){
                // west african time and date 
                ret.date = new Date(ret.date).toLocaleString("en-NG", {timeZone: "Africa/Lagos"})
            } return ret
        }
    },
    toObject: {
        virtuals: true
    }
})

const mortalityModel = mongoose.model("mortality", mortalitySchema)
export default mortalityModel
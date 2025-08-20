
import mongoose from "mongoose"

const vaccineSchema = new mongoose.Schema({
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
    vaccineName: {
        type: String,
        required: true
    },
    vaccinePrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            delete ret.id
            if(ret.date){
                ret.date = new Date(ret.date).toLocaleString("en-NG", {
                    timeZone: "Africa/Lagos"
                })
            } return ret
        }
    },
    toObject: {
        virtuals: true
    }
})

vaccineSchema.pre("save", function (next) {
    // auto calculate total amout of vaccines bought before saving
    if(this.quantity && this.vaccinePrice){
        this.totalAmount = this.quantity * this.vaccinePrice
    } next()
})

const vaccineModel = mongoose.model("vaccine", vaccineSchema)
export default vaccineModel
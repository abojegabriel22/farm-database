
import mongoose from "mongoose"
import purchaseModel from "./purchase.model"

const salesSchema = new mongoose.Schema({
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
    numberSold: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    pricePerSale: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now()
    },
    age: {
        type: Number,
        default: 0
    }
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_, ret){
            delete ret.id
            if(ret.date){
                ret.date = new Date(ret.date).toLocaleString("en-NG", {timeZone: "Africa/Lagos"})
            }
            return ret
        }
    },
    toObject: {
        virtuals: true
    }
})

// calculate price per sale and age before saving
salesSchema.pre("save", async function(next){
    if(this.numberSold && this.totalPrice){
        this.pricePerSale = this.totalPrice / this.numberSold
    }
    // calculate age in days from purchase date
    if(this.purchaseId){
        const purchase = await mongoose.model("purchase").findById(this.purchaseId)
        if(purchase?.dateOfPurchase){
            const diffTime = this.date - purchase.dateOfPurchase
            this.age = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }
    }
    next()
})

const salesModel = mongoose.model("sales", salesSchema)
export default salesModel
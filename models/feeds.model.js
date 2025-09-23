
import mongoose from "mongoose"

const feedSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    pricePerFeed: {
        type: Number,
        default: 0.00
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (
            _,
            ret
        ) => {
            delete ret.id
            if(ret.date) {
                // convert to date WAT
                ret.date = new Date(ret.date).toLocaleString("en-NG", {timeZone: "Africa/Lagos"})
            } return ret
        }
    },
    toObject: {
        virtuals: true
    }
})

feedSchema.pre("save", function(next) {
    if(this.quantity && this.totalPrice) {
        this.pricePerFeed = this.totalPrice / this.quantity
    }
    next()
})

const feedsModel = mongoose.model("feeds", feedSchema)
export default feedsModel
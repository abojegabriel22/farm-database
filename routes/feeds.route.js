import express from 'express'
import feedsModel from "../models/feeds.model"
import chalk from 'chalk'
import batchModel from '../models/batch.model'

const router = express.Router()

// Create a new feed record
router.post("/", async (req, res) => {
    const {name, quantity, totalPrice, batchId, purchaseId} = req.body
    try{
        // check for batchId
        if(!batchId || !purchaseId){
            return res.status(400).json({message: "BatchId and purchaseId is required"})
        }

        const batchExists = await batchModel.findById(batchId)
        if(!batchExists){
            return res.status(404).json({message: "Batch does not exists"})
        }

        const newFeed = new feedsModel({
            name,
            quantity,
            totalPrice,
            batchId,
            purchaseId
        })

        const savedFeed = await newFeed.save()
        console.log(chalk.hex("#00ff00")("savedFeed with batchId linked to batch"))
        return res.status(201).json({ message: "Feed record created successfully", data: savedFeed })
    } catch(err) {
        console.log(chalk.hex("#ff2314")(`Error creating feed record: ${err.message}`))
        return res.status(400).json({ message: "Error creating feed record", error: err.message})
    }
})

// get all feed records
router.get("/:batchId", async (req, res) => {
    try {
        const feedsData = await feedsModel.find({batchId: req.params.batchId}).populate("batchId", "startDate name").populate("purchaseId", "dateOfPurchase name" )
        if(feedsData.length === 0){
            return res.status(404).json({
                message: "No records found",
                data: []
            })
        }
        console.log(feedsData)
        return res.status(200).json({
            message: "Feeds fetched successfully",
            data: feedsData
        })
    } catch(err) {
        console.log(chalk.hex("#ff2314")(`Error fetching feedsData: ${err.message}`))
        return res.status(500).json({
            message: "Error fetching feed records",
            error: err.message
        })
    }
})

export default router
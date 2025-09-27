
import mongoose from "mongoose";
import express from "express"
import mortalityModel from "../models/mortality.model"
import chalk from "chalk"
import batchModel from "../models/batch.model"
import purchaseModel from "../models/purchase.model"
import salesModel from "../models/sales.model"
const router = express.Router()

// post mortality records
router.post("/", async (req, res) => {
    const { mortalityRate, batchId, purchaseId } = req.body

    try{
        if(!batchId || !purchaseId){
            return res.status(400).json({message: "BatchId and purchaseId are required"})
        }
        // calculate mortalityAge = difference in days
        
        const batchExists = await batchModel.findById(batchId)
        if(!batchExists){
            return res.status(404).json({message: "Batch does not exist"})
        }
        const purchaseExists = await purchaseModel.findById(purchaseId)
        if(!purchaseExists){
            return res.status(404).json({message: "Purchase does not exists"})
        }

        const purchasedChicks = purchaseExists.quantity || 0;

        // get total sales + mortalities so far
        const [salesSummary, mortalitySummary] = await Promise.all([
            salesModel.aggregate([
                { $match: { batchId: new mongoose.Types.ObjectId(batchId) } },
                { $group: { _id: null, totalSold: { $sum: "$numberSold" } } }
            ]),
            mortalityModel.aggregate([
                { $match: { batchId: new mongoose.Types.ObjectId(batchId) } },
                { $group: { _id: null, totalMortality: { $sum: "$mortalityRate" } } }
            ])
        ]);

        const totalSold = salesSummary[0]?.totalSold || 0;
        const totalMortality = mortalitySummary[0]?.totalMortality || 0;

        // check if new mortality breaks the rule
        if (totalSold + totalMortality + mortalityRate > purchasedChicks) {
            return res.status(400).json({
                message: "Invalid record: Sales + Mortalities exceed total purchased chicks",
                details: {
                purchasedChicks,
                currentSold: totalSold,
                currentMortality: totalMortality,
                attemptedMortality: mortalityRate,
                remainingChicks: purchasedChicks - (totalSold + totalMortality)
                }
            });
        }

        // calculate mortalityAge = difference in days from purchase.dateOfPurchase
        const now = new Date()
        const purchaseDate = new Date(purchaseExists.dateOfPurchase)
        const diffTime = now.getTime() - purchaseDate.getTime()
        const mortalityAge = Math.floor(diffTime / (1000 * 60 * 60 * 24)) // days

        // create new mortality record
        const newMortality = new mortalityModel({
            mortalityRate,
            batchId,
            purchaseId,
            mortalityAge
        })
        await newMortality.save()
        console.log(chalk.hex("#0034ff")(`Mortality recorded successfully with age ${mortalityAge} days`))
        return res.status(201).json({ message: "New record of mortality taken:", data: newMortality })
    } catch (err){
        console.log(chalk.hex("#ff2343")(`Error saving mortality record: ${err.message}`))
        return res.status(400).json({ message: "Could not save mortality records, please try again", error: err.message })
    }
})

// get all mortality records 
router.get("/:batchId", async (req, res) => {
    try {
        const mortalityRecords = await mortalityModel.find({batchId: req.params.batchId}).populate("batchId", "name startDate").populate("purchaseId", "dateOfPurchase name")

        if(mortalityRecords.length === 0){
            return res.status(404).json({
                message: "No records found",
                data: []
            })
        }
        return res.status(200).json({ message: "Mortality records fetched successfully", data: mortalityRecords })

    } catch(err){
        console.log(chalk.hex("#ff2334")(`Error trying to fetch mortality data: ${err.message}`))
        return res.status(500).json({ message: "Error while fetching mortality data:", error: err.message})
    }
})



export default router
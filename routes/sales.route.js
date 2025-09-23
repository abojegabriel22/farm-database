
import express from "express"
import salesModel from "../models/sales.model"
import chalk from "chalk"
import batchModel from "../models/batch.model"

const router = express.Router()

// take record of sales
router.post("/", async (req, res) => {
    const { numberSold, totalPrice, batchId, purchaseId } = req.body
    try{
        if(!batchId){
            return res.status(400).json({message: "BatchId is required"})
        }
        const batchExist = await batchModel.findById(batchId)
        if(!batchExist){
            return res.status(404).json({message: "Batch does not exist"})
        }
        const newSale = new salesModel({
            numberSold,
            totalPrice,
            batchId,
            purchaseId,
            date: new Date()
        })
        const saveNewSale = await newSale.save()
        console.log(chalk.hex("#34ff25")("New sale record"))
        return res.status(201).json({
            message: "New sale record",
            data: saveNewSale
        })
    } catch(err){
        console.error(chalk.hex(`Unable to save record: ${err.message}`))
        return res.status(400).json({
            message: "Unable to save record, please try again!",
            error: err.message
        })
    }
})

router.get("/:batchId", async (req, res) => {
    // res.send("route works")
    try{
        const sales = await salesModel.find({batchId: req.params.batchId}).populate("batchId", "name startDate").populate("purchaseId", "dateOfPurchase name" )
        // const sales = await salesModel.find()
        if(sales.length === 0){
            return res.status(404).json({
                message: "No record found",
                data: []
            })
        }
        console.info(chalk.hex("#3425ff")("available sales fetched"))
        return res.status(200).json({
            message: "Sales fetched successfully",
            data: sales
        })
    } catch(err){
        console.error(chalk.hex("#ff3425")("Unable to fetch sale records"))
        return res.status(500).json({
            message: "Could not fetch sale data",
            error: err.message
        })
    }
})
export default router
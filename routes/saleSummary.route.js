import express from "express"
import mongoose from "mongoose"
import salesModel from "../models/sales.model"
import saleSummaryModel from "../models/saleSummary.model"
import chalk from "chalk"
// import {getLocalTime} from "../utils/time.js"

const router = express.Router()

        // get summary of sales by batchId 
router.get("/:batchId", async (req, res) => {
  try {
    const {batchId} = req.params
    
    // aggregate sales for the batch
    const summary = await salesModel.aggregate([
      {$match: {batchId: new mongoose.Types.ObjectId(batchId)}},
      {
        $group: {
          _id: "$batchId",
          totalNumSold: {$sum: "$numberSold"},
          totalSaleAmount: {$sum: "$totalPrice"}
        }
      }
    ])
    if(summary.length === 0){
      return res.status(404).json({message: "No sale found for this batch"})
    }
    const result = {
      batchId,
      totalNumSold: summary[0].totalNumSold,
      totalSaleAmount: summary[0].totalSaleAmount
    }

    // find the most recent sale date for this batch
    const latestSale = await salesModel.findOne({ batchId })
      .sort({ date: -1 }) // newest sale
      .select("date");

    // always pass a Date object
    const resultWithTime = {
      ...result,
      lastUpdated: latestSale 
    ? new Date(new Date(latestSale.date).getTime() + 60 * 60 * 1000) 
    : new Date(Date.now() + 60 * 60 * 1000)
    };


    // create or update summary
    const updatedSummary = await saleSummaryModel.findOneAndUpdate(
      { batchId },
      resultWithTime,
      { new: true, upsert: true }
    );
    console.log(chalk.hex("#34ff25")("Sale summary updated/fetched"));
    return res.status(200).json({message: "sale summary fetched successfully", data: updatedSummary})
  } catch(err){
    console.error(chalk.hex("#ff2435")("Error fetching sale summary:", err.message));
    return res.status(500).json({message: "Failed to fetch sale summary", error: err.message})
  }
})

export default router
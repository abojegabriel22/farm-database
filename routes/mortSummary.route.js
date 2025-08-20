import express from "express"
import mongoose from "mongoose"
import chalk from "chalk"
import mortalityModel from "../models/mortality.model"
import mortModel from "../models/mortSummary.model"

const router = express.Router()

// get summary or mortalities by batchId
router.get("/:batchId", async (req, res) => {
  try{
    const { batchId } = req.params
      // aggregate mortalities for the batch
      const summary = await mortalityModel.aggregate([
        {$match: {batchId:new mongoose.Types.ObjectId(batchId)}},
        {
          $group: {
            _id: "$batchId",
            totalMortalities: {$sum: "$mortalityRate"}

          }
        }
      ])
      if(summary.length === 0){
        return res.status(400).json({message: "No mortality record found for this given batch"})
      }
      const result = {
        batchId,
        totalMortalities: summary[0].totalMortalities
      }
      // find the most recent date for this batch
      const latestMort = await mortalityModel.findOne({batchId}).sort({date: -1}).select("date")

      // always pass a date object
      const resultWithTime = {
        ...result,
        lastUpdated: latestMort ? new Date(new Date(latestMort.date).getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000)
      }
      // create or update summary
      const updatedSummary = await mortModel.findOneAndUpdate(
        { batchId },
        resultWithTime,
        {new: true, upsert: true}
      )
      console.log(chalk.hex("#34ff25")("Sale summary updated/fetched"));
      return res.status(200).json({message: "mortality records fetched successfully", data: updatedSummary})
    } catch(err){
    console.error(chalk.hex("#ff2435")("Error fetching sale summary:", err.message));
    return res.status(500).json({message: "Failed to fetch sale summary", error: err.message})
  }
})

export default router
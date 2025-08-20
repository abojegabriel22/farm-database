import express from "express";
import mongoose from "mongoose";
import chalk from "chalk";

import saleSummaryModel from "../models/saleSummary.model.js";
import feedSumModel from "../models/feedSummary.model.js";
import mortModel from "../models/mortSummary.model.js";
import totalVaccineModel from "../models/totalVaccine.model.js";
import purchaseModel from "../models/purchase.model.js";

const router = express.Router();

// get all summaries (sales, feeds, mortalities) by batchId
router.get("/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    // ensure ObjectId is valid
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batchId" });
    }

    // fetch all summaries directly
    const [salesSummary, feedSummary, mortalitySummary, totalVaccineSummary, purchaseSummary] = await Promise.all([
      saleSummaryModel.findOne({ batchId }).populate("batchId", "name startDate"),
      feedSumModel.findOne({ batchId }).populate("batchId", "name startDate"),
      mortModel.findOne({ batchId }).populate("batchId", "name startDate"),
      totalVaccineModel.findOne({ batchId}).populate("batchId", "name startDate"),
      purchaseModel.findOne({ batchId }).populate("batchId", "name startDate")
    ]);

    // respond with combined data
    return res.status(200).json({
      message: "Batch summaries fetched successfully",
      data: {
        salesSummary,
        feedSummary,
        mortalitySummary,
        totalVaccineSummary,
        purchaseSummary
      }
    });
  } catch (err) {
    console.error(chalk.hex("#ff2435")("Error fetching summaries:", err.message));
    return res.status(500).json({ message: "Failed to fetch batch summaries", error: err.message });
  }
});

export default router;

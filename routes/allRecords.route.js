import express from "express";
import mongoose from "mongoose";
import chalk from "chalk";

import saleSummaryModel from "../models/saleSummary.model.js";
import feedSumModel from "../models/feedSummary.model.js";
import mortModel from "../models/mortSummary.model.js";
import totalVaccineModel from "../models/totalVaccine.model.js";
import purchaseModel from "../models/purchase.model.js";
import batchModel from "../models/batch.model.js";

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
    if(!purchaseSummary){
      return res.status(404).json({ message: "No purchase summary found for this batch" })
    }
    // ---- 🔹 CALCULATIONS ----
    const purchasedChicks = purchaseSummary.quantity || 0;
    const totalNumSold = salesSummary?.totalNumSold || 0;
    const totalMortality = mortalitySummary?.totalMortalities || 0;
    // enforce check
    if (totalNumSold + totalMortality > purchasedChicks) {
      return res.status(400).json({
        message: "Invalid data: total sales + mortalities exceed number of chicks purchased",
        details: {
          purchasedChicks,
          totalNumSold,
          totalMortality,
          difference: totalNumSold + totalMortality - purchasedChicks
        }
      });
    }
    // ---- 🔹 CALCULATIONS ----
    const capital = purchaseSummary.price || 0;
    const revenue = salesSummary?.totalSaleAmount || 0;
    const totalFeeds = feedSummary?.totalPrices || 0;
    const totalFeedsBag = feedSummary?.totalQuantity || 0;
    const totalVaccineCost = totalVaccineSummary?.totalVaccineAmount || 0;

    const totalExpenses = capital + totalFeeds + totalVaccineCost;

    const netProfit = revenue - (capital + totalFeeds + totalVaccineCost);

    const remainingChicks = purchasedChicks - (totalNumSold + totalMortality);
    let updatedBatch = null;
    if (remainingChicks === 0) {
      updatedBatch = await batchModel.findByIdAndUpdate(
        batchId,
        {
          status: "Completed",
          endDate: new Date(),
        },
        { new: true } // return the updated document
      );
    } else {
      // fetch batch to include in response if not updated
      updatedBatch = await batchModel.findById(batchId);
    }

    // build computed summary
    const computedSummary = {
      batchId: updatedBatch,
      purchaseId: purchaseSummary._id,
      startDate: purchaseSummary.dateOfPurchase,
      capital,
      revenue,
      totalFeeds,
      totalFeedsBag,
      totalMortality,
      totalExpenses,
      netProfit,
      totalNumSold,
      purchasedChicks,
      remainingChicks
    };

    // respond with combined data
    return res.status(200).json({
      message: "Batch summaries fetched successfully",
      data: {
        salesSummary,
        feedSummary,
        mortalitySummary,
        totalVaccineSummary,
        purchaseSummary,
        computedSummary
      }
    });
  } catch (err) {
    console.error(chalk.hex("#ff2435")("Error fetching summaries:", err.message));
    return res.status(500).json({ message: "Failed to fetch batch summaries", error: err.message });
  }
});

export default router;

import express from "express";
import feedsModel from "../models/feeds.model";
import chalk from "chalk";
import mongoose from "mongoose";
const router = express.Router();
import feedSumModel from "../models/feedSummary.model";

// get summary of feeds per purchase for a batch + overall total
router.get("/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    const summary = await feedsModel.aggregate([
      { $match: { batchId: new mongoose.Types.ObjectId(batchId) } },
      {
        $group: {
          _id: "$purchaseId", // group by purchaseId
          totalQuantity: { $sum: "$quantity" },
          totalPrice: { $sum: "$totalPrice" }
        }
      },
      {
        $lookup: {
          from: "purchases",             // collection name in MongoDB
          localField: "_id",             // purchaseId from feeds
          foreignField: "_id",           // match _id in purchases
          as: "purchaseDetails"
        }
      },
      { $unwind: "$purchaseDetails" } // flatten purchase info
    ]);

    if (summary.length === 0) {
      return res.status(404).json({ message: "No feed records found for this batch" });
    }

    // compute grand total across all purchaseId groups
    const grandTotals = summary.reduce(
      (acc, item) => {
        acc.totalQuantity += item.totalQuantity;
        acc.totalPrices += item.totalPrice;
        return acc;
      },
      { totalQuantity: 0, totalPrices: 0 }
    );

    // upsert grand total into feedSumModel
    // find the latest feed for the batch
    const latestFeed = await feedsModel.findOne({ batchId })
      .sort({ date: -1 })   // newest feed
      .select("date");

    // if there's at least one feed, add 1 hour to its date
    let latestFeedDate = null;
    if (latestFeed && latestFeed.date) {
      latestFeedDate = new Date(new Date(latestFeed.date).getTime() + 60 * 60 * 1000);
    }

    const updatedSummary = await feedSumModel.findOneAndUpdate(
      { batchId },
      { 
        ...grandTotals,
        updatedAt: latestFeedDate // only update to latest feed date +1h
      },
      { new: true, upsert: true }
    );


    return res.status(200).json({
      message: "Feed summary per purchase + grand total fetched successfully",
      perPurchase: summary,
      grandTotal: updatedSummary
    });
  } catch (err) {
    console.error(chalk.hex("#ff3425")("Error fetching feed summary:", err.message));
    return res.status(500).json({ message: "Failed to fetch feed summary", error: err.message });
  }
});

export default router;
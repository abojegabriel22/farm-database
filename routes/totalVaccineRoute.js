import express from "express";
import totalVaccineModel from "../models/totalVaccine.model.js";
import chalk from "chalk";

const router = express.Router();

// Get total vaccines for a batch
router.get("/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    const totalData = await totalVaccineModel.findOne({ batchId }).populate("batchId", "name startDate");

    if (!totalData) {
      return res.status(404).json({ message: "No summary found for this batch" });
    }

    res.status(200).json({
      message: "Total vaccine summary fetched",
      data: totalData
    });

  } catch (err) {
    console.log(chalk.red(`❌ Error fetching total vaccine summary: ${err.message}`));
    res.status(500).json({ message: "Could not fetch total vaccine summary", error: err.message });
  }
});

export default router;

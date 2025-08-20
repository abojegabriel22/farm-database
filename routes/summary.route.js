import express from "express"
import { updateSummary } from "../utils/updateSummary"
import chalk from "chalk"
import summaryModel from "../models/summary.model"

const router = express.Router()

// GET summary
router.get("/", async (req, res) => {
    try {
        const summary = await summaryModel.findOne(); // fetch latest summary
        res.json(summary || {});
    } catch (err) {
        console.error(chalk.hex("#ff2435")("Failed to get summary: ", err.message));
        res.status(500).json({ error: "Failed to fetch summary" });
    }
});

router.put("/", async (req, res) => {
    try {
        const updated = await updateSummary()
        res.json({mesage: "summary added", data: updated})
    } catch(err){
        console.error(chalk.hex("#ff2435")("Failed to update summary"))
        res.status(500).json({error: "Failed to update summary"})
    }
})
export default router
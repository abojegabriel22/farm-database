
import express from "express"
import chalk from "chalk"
import batchModel from "../models/batch.model"
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware.js'

const router = express.Router()

// create batch
router.post("/", authMiddleWare, async (req, res) => {
    try{
        const batch = new batchModel(req.body)
        await batch.save()

        const responseData = {
            "Batch Name": batch.name,
            "Batch ID": batch._id,
            "Description": batch.description || "N/A",
            "Status": batch.status,
            "Start Date": new Date(batch.startDate).toLocaleString("en-GB"),
            "Created On": new Date(batch.createAt).toLocaleString("en-GB"),
        };

        // ✅ Send admin email
        if (req.user && req.user.role === "admin") {
            const tableRows = Object.entries(responseData)
            .map(
            ([key, value]) => `
                <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
                </tr>
            `
            )
            .join("");

            await sendEmail(
                req.user.email,
                "🐥 New Batch Created",
                `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">New Batch Created</h2>
                    <p>Hello <b>${req.user.username || req.user.name || "Admin"}</b>,</p>
                    <p>A new poultry batch <b>${batch.name}</b> has been created successfully.</p>

                    <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
                    <tr style="background: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 8px;">Field</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
                    </tr>
                    ${tableRows}
                    </table>

                    <p style="margin-top: 20px;">Best regards,<br/>Poultry Farm System</p>
                </div>
                `
            );
        }
        console.log(chalk.green('✅ Purchase record created and email sent.'));

        res.status(201).json({message: "New batch created", data: batch})
    } catch(err){
        res.status(400).json({message: "could not create batch", error: err.message})
    }
})

// Terminate batch
router.put("/:id/terminate", async (req, res) => {
    try {
        const batch = await batchModel.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        // Only terminate active batches
        if (batch.status !== "Active") {
            return res.status(400).json({ message: "Only active batches can be terminated" });
        }

        batch.status = "Completed";  // or "Completed"
        batch.endDate = new Date(); // record termination date
        await batch.save();

        res.json({ message: "Batch terminated successfully", data: batch });
    } catch (err) {
        console.error("Error terminating batch:", err);
        res.status(500).json({ error: err.message });
    }
});

// get all batches
router.get("/", async (req, res) => {
    try{
        const batches = await batchModel.find().sort({createAt: -1})
        res.json({message: "fetched batches", data: batches})
    } catch(err){
        res.status(500).json({message: "Could not fetch", error: err.message})
    }
})

// get single batch
router.get("/:id", async (req, res) => {
    try{
        const batch = await batchModel.findById(req.params.id)
        if(!batch){
            return res.status(404).json({error: "No batch found for this id"})
        }
        res.json({message: "data available", data: batch})
    } catch(err){
        res.status(500).json({error: err.message})
    }
})

// get all batches allocated to a particular user
router.get("/admin/:userId", async (req, res) => {
    try{
        const {userId} = req.params
        // find all batches belonging to this user
        const userBatches = await batchModel.find({userId})
        if(!userBatches || userBatches.length === 0){
            return res.status(404).json({message: "No batch found for this user"})
        }
        res.json(userBatches)
    } catch(err){
        console.error("Error fetching user batches:", err)
        res.status(500).json({ message: "Server error", error: err.message })
    }
})

// Update batch
router.put("/:id", async (req, res) => {
    try {
        const batch = await batchModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!batch) return res.status(404).json({ error: "Batch not found" });
        res.json(batch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete batch
router.delete("/:id", async (req, res) => {
    try {
        const batch = await batchModel.findByIdAndDelete(req.params.id);
        if (!batch) return res.status(404).json({ error: "Batch not found" });
        res.json({ message: "Batch deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



export default router
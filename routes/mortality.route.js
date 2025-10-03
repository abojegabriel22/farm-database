
import mongoose from "mongoose";
import express from "express"
import mortalityModel from "../models/mortality.model"
import chalk from "chalk"
import batchModel from "../models/batch.model"
import purchaseModel from "../models/purchase.model"
import salesModel from "../models/sales.model"
const router = express.Router()
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware'

// post mortality records
router.post("/", authMiddleWare, async (req, res) => {
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

        // send email notification (optional) only to the logged in admin
        if (req.user && req.user.role === "admin") {
            const responseData = {
                "Batch Name": batchExists.name,
                "Batch ID": newMortality.batchId,
                "Purchase Name": purchaseExists.name,
                "Purchase ID": newMortality.purchaseId,
                "Purchase Date": new Date(purchaseExists.dateOfPurchase).toLocaleDateString(),
                "Mortality Rate": newMortality.mortalityRate,
                "Mortality Age (days)": newMortality.mortalityAge,
                "Date Recorded": new Date(newMortality.date).toLocaleString()
            };

            const tableRows = Object.entries(responseData).map(
                ([key, value]) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
                    </tr>
                `
            ).join("");

            const summaryLine = `
                <p style="font-size: 15px; color: #444;">
                    ✅ <b>${newMortality.mortalityRate}</b> mortalities were recorded in 
                    <b>Batch: ${batchExists.name}</b> 
                    (Purchase: ${purchaseExists.name}, ${new Date(purchaseExists.dateOfPurchase).toLocaleDateString()}).
                </p>
            `;

            await sendEmail(
                req.user.email,
                "🐔 Admin Mortality Record Notification",
                `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #E53935;">New Mortality Record</h2>
                        <p>Hello <b>${req.user.username || req.user.name || "Admin"}</b>,</p>

                        ${summaryLine}

                        <p>Here are the full details:</p>

                        <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
                            <tr style="background: #f2f2f2;">
                                <th style="border: 1px solid #ddd; padding: 8px;">Field</th>
                                <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
                            </tr>
                            ${tableRows}
                        </table>

                        <p style="margin-top: 20px;">Best regards,<br/>Farm Management System</p>
                    </div>
                `
            );
        }

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

import mongoose from "mongoose";
import express from "express"
import salesModel from "../models/sales.model"
import chalk from "chalk"
import batchModel from "../models/batch.model"
import mortalityModel from "../models/mortality.model"
import purchaseModel from "../models/purchase.model";
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware'

const router = express.Router()

// take record of sales
router.post("/", authMiddleWare, async (req, res) => {
    const { numberSold, totalPrice, batchId, purchaseId } = req.body
    try{
        if(!batchId || !purchaseId){
            return res.status(400).json({message: "BatchId and purchaseId are required"})
        }
        const batchExist = await batchModel.findById(batchId)
        if(!batchExist){
            return res.status(404).json({message: "Batch does not exist"})
        }
        // check purchase
        const purchaseExist = await purchaseModel.findById(purchaseId);
        if (!purchaseExist) {
        return res.status(404).json({ message: "Purchase record not found" });
        }

        const purchasedChicks = purchaseExist.quantity || 0;

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

        // check if new sale breaks the rule
        if (totalSold + totalMortality + numberSold > purchasedChicks) {
        return res.status(400).json({
            message: "Invalid record: Sales + Mortalities exceed total purchased chicks",
            details: {
            purchasedChicks,
            currentSold: totalSold,
            currentMortality: totalMortality,
            attemptedToSell: numberSold,
            remainingChicks: purchasedChicks - (totalSold + totalMortality)
            }
        });
        }

        const newSale = new salesModel({
            numberSold,
            totalPrice,
            batchId,
            purchaseId,
            date: new Date()
        })
        const saveNewSale = await newSale.save()

        // populate batch + purchase info for email
        const populatedSale = await salesModel.findById(saveNewSale._id)
            .populate("batchId", "name startDate")
            .populate("purchaseId", "dateOfPurchase name");

        // ✅ Email notification to admin
        if (req.user && req.user.role === "admin") {
            const responseData = {
                "Sale ID": populatedSale._id,
                "Batch Name": populatedSale.batchId?.name || "N/A",
                "Batch ID": populatedSale.batchId?._id || batchId,
                "Purchase Name": populatedSale.purchaseId?.name || "N/A",
                "Purchase ID": populatedSale.purchaseId?._id || purchaseId,
                "Number Sold": populatedSale.numberSold,
                "Total Price (NGN)": populatedSale.totalPrice,
                "Price Per Sale (NGN)": populatedSale.pricePerSale,
                "Age (days)": populatedSale.age,
                "Date Recorded": populatedSale.date
            };

            const safeResponseData = Object.entries(responseData).map(([key, value]) => [
                key,
                typeof value === "object" && value !== null ? value.toString() : value
            ]);

            const tableRows = safeResponseData.map(
                ([key, value]) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
                    </tr>
                `
            ).join("");

            const summaryLine = `
                <p style="font-size: 15px; color: #444;">
                    ✅ <b>${populatedSale.numberSold}</b> chicks sold for 
                    <b>₦${populatedSale.totalPrice}</b> 
                    from batch <b>${populatedSale.batchId?.name}</b>.
                </p>
            `;

            await sendEmail(
                req.user.email,
                "💰 Admin Sales Record Notification",
                `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #4CAF50;">New Sale Recorded</h2>
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

        console.log(chalk.hex("#34ff25")("New sale record"))
        return res.status(201).json({
            message: "New sale record",
            data: populatedSale
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
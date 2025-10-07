import express from 'express'
import feedsModel from "../models/feeds.model"
import chalk from 'chalk'
import batchModel from '../models/batch.model'
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware'

const router = express.Router()

// Create a new feed record
router.post("/", authMiddleWare, async (req, res) => {
    const {name, quantity, totalPrice, batchId, purchaseId} = req.body
    try{
        // check for batchId
        if(!batchId || !purchaseId){
            return res.status(400).json({message: "BatchId and purchaseId is required"})
        }

        const batchExists = await batchModel.findById(batchId)
        if(!batchExists){
            return res.status(404).json({message: "Batch does not exists"})
        }

        const newFeed = new feedsModel({
            name,
            quantity,
            totalPrice,
            batchId,
            purchaseId
        })

        const savedFeed = await newFeed.save()

        // 🔎 populate batch to get name
        const populatedFeed = await savedFeed.populate("batchId", "name");

        // ✅ send email notification only to logged in admin
        if (req.user && req.user.role === "admin") {
            const responseData = {
                "Feed ID": populatedFeed._id,
                "Name": populatedFeed.name,
                "Quantity (Bags)": populatedFeed.quantity,
                "Price Per Feed (NGN)": populatedFeed.pricePerFeed,
                "Total Price (NGN)": populatedFeed.totalPrice,
                "Batch Name": populatedFeed.batchId?.name || "N/A",
                "Batch ID": populatedFeed.batchId?._id || populatedFeed.batchId,
                "Purchase ID": populatedFeed.purchaseId,
                "Date Recorded": populatedFeed.date
            };

            const tableRows = Object.entries(responseData).map(
                ([key, value]) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
                    </tr>
                `
            ).join("");

            const summaryLine = `
                <p style="font-size: 15px; color: #444;">
                    ✅ <b>${populatedFeed.quantity}</b> bags of feed (<b>${populatedFeed.name}</b>) 
                    recorded for batch <b>${populatedFeed.batchId?.name}</b> 
                    at <b>₦${populatedFeed.pricePerFeed}</b> per feed, 
                    totaling <b>₦${populatedFeed.totalPrice}</b>.
                </p>
            `;

            await sendEmail(
                req.user.email,
                "🌾 Admin Feed Record Notification",
                `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #4CAF50;">New Feed Recorded</h2>
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


        console.log(chalk.hex("#00ff00")("savedFeed with batchId linked to batch"))
        return res.status(201).json({ message: "Feed record created successfully", data: savedFeed })


    } catch(err) {
        console.log(chalk.hex("#ff2314")(`Error creating feed record: ${err.message}`))
        return res.status(400).json({ message: "Error creating feed record", error: err.message})
    }
})

// get all feed records
router.get("/:batchId", async (req, res) => {
    try {
        const feedsData = await feedsModel.find({batchId: req.params.batchId}).populate("batchId", "startDate name").populate("purchaseId", "dateOfPurchase name" )
        if(feedsData.length === 0){
            return res.status(404).json({
                message: "No records found",
                data: []
            })
        }
        console.log(feedsData)
        return res.status(200).json({
            message: "Feeds fetched successfully",
            data: feedsData
        })
    } catch(err) {
        console.log(chalk.hex("#ff2314")(`Error fetching feedsData: ${err.message}`))
        return res.status(500).json({
            message: "Error fetching feed records",
            error: err.message
        })
    }
})

export default router
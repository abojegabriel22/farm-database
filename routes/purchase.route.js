
import express from 'express'
import purchaseModel from '../models/purchase.model.js'
import chalk from 'chalk'
import batchModel from '../models/batch.model.js'
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware.js'


const router = express.Router()

// Create a new purchase record
router.post("/", authMiddleWare, async (req, res) => {
    const { name, quantity, price, batchId } = req.body
    try {
        // validate batchId
        if(!batchId){
            return res.status(400).json({message: "BatchId is required to proceed"})
        }
        // check if batch exists
        const batchExist = await batchModel.findById(batchId)
        if(!batchExist){
            return res.status(404).json({message: "Batch does not exists"})
        }
        // create new purchase record with batchId
        const newPurchase = new purchaseModel({
            name,
            quantity,
            price,
            batchId
        })
        const savedPurchase = await newPurchase.save()

        // populate batch info so we can include batch name in email
        const populatedPurchase = await savedPurchase.populate("batchId", "name startDate")

        // send email notification (optional) only to the logged in admin
        // ✅ send email notification only to the logged-in admin
        if (req.user && req.user.role === "admin") {
            const responseData = {
                "Purchase ID": populatedPurchase._id,
                "Name": populatedPurchase.name,
                "Quantity": populatedPurchase.quantity,
                "Price": populatedPurchase.price,
                "Price per chick": populatedPurchase.pricePerChick,
                "Batch Name": populatedPurchase.batchId?.name || "N/A",
                "Batch ID": populatedPurchase.batchId?._id || batchId,
                "Start Date": populatedPurchase.batchId?.startDate,
                "Date Recorded": populatedPurchase.dateOfPurchase
            }

            const tableRows = Object.entries(responseData).map(
                ([key, value]) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
                    </tr>
                `
            ).join("")

            const summaryLine = `
                <p style="font-size: 15px; color: #444;">
                    ✅ <b>${populatedPurchase.quantity}</b> chicks (<b>${populatedPurchase.name}</b>) 
                    purchased at <b>${populatedPurchase.pricePerChick}</b> each 
                    for batch <b>${populatedPurchase.batchId?.name}</b>.
                </p>
            `

            await sendEmail(
                req.user.email,
                "🐥 Admin Purchase Record Notification",
                `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #2196F3;">New Purchase Recorded</h2>
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
            )
        }

        console.log(chalk.green("Record created and saved success and linked to batch"))
         // Send success response
        return res.status(201).json({
            message: "Purchase record created successfully",
            data: savedPurchase
        })
    
    } catch(err){
        console.error(chalk.hex("#ff2314")(`Error creating purchase record: ${err.message}`))
        return res.status(400).json({message: "Error creating record", error: err.message})
    }
})

// Get all purchase records
router.get("/:batchId", async (req, res) => {
    try {
        const purchases = await purchaseModel.find({batchId: req.params.batchId}).populate("batchId", "name startDate")
        if(purchases.length === 0){
            return res.status(404).json({
                message: "No record found",
                data: []
            })
        }
        return res.status(200).json({
            message: "Purchases fetched successfully",
            data: purchases
        })
    } catch (err) {
        console.error(chalk.hex("#ff2314")(`Error fetching purchases: ${err.message}`))
        return res.status(500).json({
            message: "Error fetching records",
            error: err.message
        })
    }
})

export default router
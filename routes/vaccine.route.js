
import express from "express"
import vaccineModel from "../models/vaccine.model"
import chalk from "chalk"
import batchModel from "../models/batch.model"
import totalVaccineModel from "../models/totalVaccine.model.js";
const router = express.Router()
import { sendEmail } from '../utils/email'
import { authMiddleWare } from '../middlewares/auth.middleware'

// post vaccine and take record
router.post("/", authMiddleWare, async (req, res) => {
  const { vaccineName, vaccinePrice, quantity, batchId, purchaseId } = req.body

  try {
    if(!batchId){
        return res.status(400).json({message: "BatchId is required"})
    }
    const batchExist = batchModel.findById(batchId)
    if(!batchExist){
        return res.status(404).json({message: "Batch does not exist"})
    }
    const newVaccine = new vaccineModel({
        vaccineName,
        vaccinePrice,
        quantity,
        batchId,
        purchaseId
    })
    const savedVaccine = await newVaccine.save()
    // After saving, recalc total & last date
    const result = await vaccineModel.aggregate([
    { $match: { batchId: newVaccine.batchId } },
      {
        $group: {
        _id: "$batchId",
        total: { $sum: "$totalAmount" },
        lastDate: { $max: "$date" }
        }
      }
    ]);

    if (result.length > 0) {
      // Add +1 hour to lastDate
      const lastDateWithExtraHour = new Date(result[0].lastDate);
      lastDateWithExtraHour.setHours(lastDateWithExtraHour.getHours() + 1);

      await totalVaccineModel.findOneAndUpdate(
        { batchId: newVaccine.batchId },
        {
        totalVaccineAmount: result[0].total,
        dateUpdated: lastDateWithExtraHour
        },
        { upsert: true, new: true }
      );
    }

    // Populate for response + email
    const populatedVaccine = await vaccineModel.findById(savedVaccine._id)
      .populate("batchId", "name startDate")
      .populate("purchaseId", "name dateOfPurchase")

    // ✅ Send email to admin
    if (req.user && req.user.role === "admin") {
      const responseData = {
        "Vaccine ID": populatedVaccine._id,
        "Batch Name": populatedVaccine.batchId?.name || "N/A",
        "Batch ID": populatedVaccine.batchId?._id || batchId,
        "Purchase Name": populatedVaccine.purchaseId?.name || "N/A",
        "Vaccine Name": populatedVaccine.vaccineName,
        "Quantity": populatedVaccine.quantity,
        "Vaccine Price": populatedVaccine.vaccinePrice,
        "Total Amount": populatedVaccine.totalAmount,
        "Date Recorded": populatedVaccine.date
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
          💉 <b>${populatedVaccine.vaccineName}</b> vaccine given 
          (<b>${populatedVaccine.quantity}</b> doses) 
          to batch <b>${populatedVaccine.batchId?.name}</b>.
        </p>
      `

      await sendEmail(
        req.user.email,
        "💉 Admin Vaccine Record Notification",
        `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #4CAF50;">New Vaccine Record</h2>
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

    console.log(chalk.hex("#2335ff")(`new vaccine record taken and totalVaccineModel updated: ${savedVaccine._id}`))
    return res.status(201).json({
      message: "New vaccine record taken successfully",
      data: savedVaccine
    })
  } catch(err){
    console.log(chalk.hex("#ff2335")(`Error saving new vacine record: ${err.message}`))
    return res.status(400).json({
      message: "Error trying to save vaccine record",
      error: err.message
    })
  }
})

// get all vaccine records
router.get("/:batchId", async (req, res) => {
    try{
        const vaccineR = await vaccineModel.find({batchId: req.params.batchId}).populate("batchId", "name startDate")
        if(vaccineR.length === 0){
            return res.status(404).json({
                message: "No records found",
                data: []
            })
        }
        console.log(chalk.hex("#2325ff")(`fetched vaccine records successfully`))
        return res.status(200).json({
            message: "Vaccine records fetched successfully",
            data: vaccineR
        })
    } catch(err){
        console.error(chalk.hex("#ff2435")(`Error fetching vaccine records: ${err.message}`))
        return res.status(500).json({
            message: "Could not fetch vaccine records",
            error: err.message
        })
    }
})

export default router
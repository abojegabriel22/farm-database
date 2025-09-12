
import express from "express"
import chalk from "chalk"
import batchModel from "../models/batch.model"

const router = express.Router()

// create batch
router.post("/", async (req, res) => {
    try{
        const batch = new batchModel(req.body)
        await batch.save()
        res.status(201).json({message: "New batch created", data: batch})
    } catch(err){
        res.status(400).json({message: "could not create batch", error: err.message})
    }
})

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
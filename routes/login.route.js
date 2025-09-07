import express from "express"
import chalk from "chalk"
import jwt from "jsonwebtoken"
import loginModel from "../models/login.model"
import registerModel from "../models/register.model"

const router = express.Router()

// JWT secret key (use .env in production!)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// user login
router.post("/", async (req, res) => {
    const { username, password } = req.body
    try {
        // ✅ check required fields
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // ✅ find user in DB
        const userExist = await registerModel.findOne({ username })
        if (!userExist) {
            return res.status(400).json({ message: "User does not exist. Please register" })
        }

        // ✅ check password
        const isMatch = await userExist.comparePassword(password) // you named it comparePassword earlier
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        // ✅ generate JWT
        const token = jwt.sign(
            { id: userExist._id, role: userExist.role }, // payload
            JWT_SECRET,
            { expiresIn: "1h" } // token expires in 1 hour
        )

        // ✅ store login history (optional)
        const newLogin = new loginModel({
            userId: userExist._id,
            username: userExist.username,
        })
        await newLogin.save()

        const lastLogin = await loginModel
            .findOne({ userId: userExist._id })
            .sort({ loginAt: -1 }) // sort descending
            .skip(1) // skip the most recent (current) login
            .select("loginAt")

        // ✅ success response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: userExist._id,
                name: userExist.name,
                email: userExist.email,
                username: userExist.username,
                role: userExist.role,
                createdAt: userExist.createdAt,
                updatedAt: userExist.updatedAt,
                lastLogin: lastLogin ? lastLogin.loginAt : null
            }
        })

    } catch (error) {
        console.error(chalk.red("Login error:"), error.message)
        res.status(500).json({ message: "Server error" })
    }
})

export default router

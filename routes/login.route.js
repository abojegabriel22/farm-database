import express from "express"
import chalk from "chalk"
import jwt from "jsonwebtoken"
// import loginModel from "../models/login.model"
import registerModel from "../models/register.model"

const router = express.Router()

// JWT secret key (use .env in production!)
const JWT_SECRET = process.env.JWT_SECRET

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
            return res.status(401).json({ message: "Wrong password!" })
        }

        // ✅ generate JWT
        const token = jwt.sign(
            {
                 id: userExist._id,
                 role: userExist.role,
                 email: userExist.email,
                 username: userExist.username

             }, // payload
            JWT_SECRET,
            { expiresIn: "1h" } // token expires in 1 hour
        )

        // ✅ store login history (optional)
        // const newLogin = new loginModel({
        //     userId: userExist._id,
        //     username: userExist.username,
        // })
        // await newLogin.save()

        // const lastLogin = await registerModel
        //     .findOne({ userId: userExist._id })
        //     .sort({ loginAt: -1 }) // sort descending
        //     .skip(1) // skip the most recent (current) login
        //     .select("loginAt")
        const lastLogin = userExist.loginAt

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
                lastLogin: lastLogin || null,
                auth: true
            }
        })
        await registerModel.updateOne(
            { _id: userExist._id },
            { $set: { auth: true, loginAt: new Date(Date.now() + 60 * 60 * 1000) } }
        )
        console.log(chalk.green("User logged in:", username))

    } catch (error) {
        console.error(chalk.red("Login error:"), error.message)
        res.status(500).json({ message: "Server error" })
    }
})

//////// user info route /////////
router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if(!token){
            return res.status(401).json({ message: "No token provided"})
        }
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await registerModel.findById(decoded.id).select("-password")
        if(!user){
            return res.status(404).json({ message: "User not found"})
        }
        res.status(200).json({ user })
    } catch(err){
        console.error(chalk.red("Fetch user error:"), err.message)
        res.status(500).json({ message: "Server error", error: err.message })
    }
})

/////////// logout route/////////
router.post("/logout", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if(!token){
            return res.status(401).json({ message: "No token provided" })
        }
        const decoded = jwt.verify(token, JWT_SECRET)
        await registerModel.updateOne(
            { _id: decoded.id },
            { $set: { auth: false } }
        )
        res.status(200).json({ message: "Logout successful" })
        console.log(chalk.yellow("User logged out:", decoded.id))
    } catch(err){
        console.error(chalk.red("Logout error:"), err.message)
        res.status(500).json({ message: "There was error while trying to log you out!", error: err.message })
    }
})

export default router

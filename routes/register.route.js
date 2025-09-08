import express from 'express'
import chalk from 'chalk'
import registerModel from '../models/register.model'
const router = express.Router() 

// user registration
router.post("/", async (req, res) => {
    const { name, email, username, password, role } = req.body
    try {
        if(!name || !email || !username || !password) {
            return res.status(401).json({ message: "All fields are required"})
        }
        const userExist = await registerModel.findOne({
            $or: [{ email }, { username }]
        })
        if(userExist) {
            return res.status(400).json({ message: "User already exist. please login"})
        }
        const newUser = new registerModel({
            name,
            email,
            username,
            password,
            role: role || 'user',
            auth: false
        })
        const saveNewUser = await newUser.save()
        console.log(chalk.hex("#34ff25")("New user registered"))
        return res.status(201).json({
            message: "New user registered",
            data: saveNewUser
        })
    } catch(err){
        console.error(chalk.hex("#ff3425")(`Unable to register user: ${err.message}`))
        return res.status(500).json({
            message: "Unable to register user, please try again!",
            error: err.message
        })
    }
})

export default router
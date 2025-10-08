import express from 'express'
import chalk from 'chalk'
import registerModel from '../models/register.model'
import { sendEmail } from '../utils/email'
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

        // generate 6 digit verification code 
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        const newUser = new registerModel({
            name,
            email,
            username,
            password,
            role: role || 'user',
            auth: false,
            verificationCode: code,
            verificationCodeExpires: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
        })

        // send verification email 
        await sendEmail(
            email,
            "Email Verification code - Farm Database",
            `<p>Your verification code is: <b style="font-size: 20px; color: blue;">${code}</b></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>`
        )
        console.log(chalk.hex("#34ff25")("Verification code sent to user email"));

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

router.post("/verify", async (req, res) => {
    const { email, code } = req.body

    try{
        const user = await registerModel.findOne({email})
        if(!user){
            return res.status(404).json({ message: "User not found" })
        }
        if(user.verificationCode !== code){
            return res.status(400).json({ message: "Invalid verification code" })
        }
        // check expiration
        if (Date.now() > user.verificationCodeExpires) {
            return res.status(400).json({ message: "Verification code has expired" });
        }
        user.isVerified = true
        user.auth = true
        user.verificationCode = null
        user.verificationCodeExpires = null
        console.log(chalk.hex("#34ff25")("User email verified: " + email));
        await user.save({ validateBeforeSave: false })
        return res.status(200).json({ message: "Email verified successfully" });
    }
    catch (err) {
        console.error(chalk.red(`Verification error: ${err.message}`));
        return res.status(500).json({ message: "Verification failed", error: err.message });
    }
})

router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await registerModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // 🕒 Use lastVerificationSent (not updatedAt)
    if (user.lastVerificationSent && Date.now() - user.lastVerificationSent.getTime() < 60000) {
      return res.status(429).json({
        message: "Please wait 1 minute before requesting a new code",
      });
    }

    // generate new 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    user.lastVerificationSent = Date.now(); // 🟢 Save correct cooldown time

    await sendEmail(
      email,
      "Resend Email Verification Code - Farm Database",
      `<p>Your new verification code is:
        <b style="font-size: 20px; color: blue;">${newCode}</b></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>`
    );

    await user.save({ validateBeforeSave: false });
    console.log(chalk.hex("#34ff25")(`✅ New verification code sent to ${email}`));

    return res.status(200).json({ message: "Verification code resent successfully" });
  } catch (err) {
    console.error(chalk.red(`Resend code error: ${err.message}`));
    return res.status(500).json({
      message: "Could not resend verification code",
      error: err.message,
    });
  }
});


export default router
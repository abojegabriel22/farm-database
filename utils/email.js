
import nodemailer from "nodemailer"

// transporter setup (use your real SMTP details or Gmail App Passwords)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    // service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Poultry Farm System" <${process.env.EMAIL_USER}>`, // ✅ fixed
            to,
            subject,
            html
        })
        console.log("✅ Email sent:", info.messageId)
    } catch(err){
        console.error("❌ Error sending email:", err.message)
    }
}

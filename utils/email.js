
// import nodemailer from "nodemailer"
import { Resend } from "resend";

const resend = new Resend(process.env.GO_KEY); // RESEND API KEY

export const sendEmail = async (to, subject, html) => {
    try {
        const {data, error} = await resend.emails.send({
            from: `Poultry Farm System <farm@smartpoultry.abojeg.name.ng>`,
            to,
            subject,
            html
        })
        if (error) {
            console.error("❌ Error sending email:", error);
            return;
        }
        console.log("✅ Email sent:", data.id);
    } catch (err) {
        console.error("❌ Error sending email:", err.message);
    }
}
// transporter setup (use your real SMTP details or Gmail App Passwords)
// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: true, // true because you're using port 465 (SSL)
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// })
// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // use STARTTLS
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// })

// export const sendEmail = async (to, subject, html) => {
//     try {
//         const info = await transporter.sendMail({
//             from: `"Poultry Farm System" <${process.env.EMAIL_USER}>`, // ✅ fixed
//             to,
//             subject,
//             html
//         })
//         console.log("✅ Email sent:", info.messageId)
//     } catch(err){
//         console.error("❌ Error sending email:", err.message)
//     }
// }

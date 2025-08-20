
import mongoose from "mongoose"
import dotenv from "dotenv"
import chalk from "chalk"
dotenv.config()

const mongoUrl = process.env.MongdbUrl
// console.log('raw mongoUrl:', JSON.stringify(mongoUrl));

const RETRY_DELAY = 5000 // 5 SECONDS
const MAX_RETRY = 5
let RETRY_COUNT = 0

const dbConect = async () => {
    try {
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log(chalk.hex('#00ff00')(`Good morning my neighbor!, smile database!`))
    }
    catch(err){
        RETRY_COUNT++
        console.log("error connecting to database", err.message)
        if(RETRY_COUNT < MAX_RETRY){
            console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`)
            setTimeout(dbConect, RETRY_DELAY)
        } else{
            console.error("Exiting process. max retry reached!")
            process.exit(1)
        }
    }
}

export default dbConect
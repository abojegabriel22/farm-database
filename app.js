import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import SwaggerParser from "swagger-parser";
import path from "path";
import dotenv from "dotenv";
import dbConnect from "./controller/dbController.js";
import chalk from "chalk";

import feedsRoute from "./routes/feeds.route.js";
import mortalityRoute from "./routes/mortality.route.js";
import purchaseRoute from "./routes/purchase.route.js";
import vaccinationRoute from "./routes/vaccine.route.js";
import salesRoute from "./routes/sales.route.js"
import summaryRoute from "./routes/summary.route.js"
import batchRoute from "./routes/batch.route.js"
import batchData from "./routes/allRecords.route.js"
import saleSummaryRoute from "./routes/saleSummary.route.js"
import mortalitySummaryRoute from "./routes/mortSummary.route.js"
import feedSumRoute from "./routes/feedsTotal.route.js";
import allRecordsRoute from "./routes/allRecords.route.js";
import totalVaccineRoute from "./routes/totalVaccineRoute.js";

dotenv.config();
const app = express();
const port = process.env.PORT

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use("/chicken-api/feeds", feedsRoute);
app.use("/chicken-api/mortality", mortalityRoute);
app.use("/chicken-api/purchase", purchaseRoute);
app.use("/chicken-api/vaccine", vaccinationRoute);
app.use("/chicken-api/sales", salesRoute)
// app.use("/chicken-api/summary", summaryRoute)
app.use("/chicken-api/batch", batchRoute)
app.use("/chicken-api/batchdata", batchData)
app.use("/chicken-api/sale-summary", saleSummaryRoute)
app.use("/chicken-api/mortality-sum", mortalitySummaryRoute)
app.use("/chicken-api/feeds-total", feedSumRoute)
app.use("/chicken-api/all-records", allRecordsRoute);
app.use("/chicken-api/total-vaccine", totalVaccineRoute);

// Example route
app.get("/", (req, res) => {
    res.send("This is database for recording chickens");
});

// Async init
(async () => {
    try {
        await dbConnect();

        // Swagger UI with dynamic reload
        app.use(
        "/chicken-api/swagger-ui",
        swaggerUi.serve,
        async (req, res, next) => {
            try {
            const swaggerDocument = await SwaggerParser.bundle(
                path.resolve("./swagger-folder/openapi.yaml")
            );
            return swaggerUi.setup(swaggerDocument)(req, res, next);
            } catch (err) {
            next(err);
            }
        }
        );

        app.listen(port, () => {
            console.log(chalk.hex("#00aeff")(`Server listening on port ${port}`));
            console.log(
                chalk.hex("#ffaa00")(
                    `Swagger UI: http://localhost:${port}/chicken-api/swagger-ui`
                )
            );
        });
    } catch (err) {
        console.error(chalk.red("Error starting server"), err.message);
    }
})();

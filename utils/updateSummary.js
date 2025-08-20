
import chalk from "chalk"
import summaryModel from "../models/summary.model"
import feedsModel from "../models/feeds.model";
import purchaseModel from "../models/purchase.model";
import salesModel from "../models/sales.model";
import mortalityModel from "../models/mortality.model";
import vaccineModel from "../models/vaccine.model";

export async function updateSummary () {
  try{
    // get all purchase throught their batches 
    const purchases = purchaseModel.find()
    let summaries = []

    for (const purchase of purchases){
      const purchaseId = purchase._id
      // total feeds for this purchase
      const totalFeedsData = await feedsModel.aggregate([
        {$match: {purchaseId}},
        {$group: {_id: null, totalQuantity: {$sum: "$quantity"}}}
      ])
      const totalFeeds = totalFeedsData[0]?.totalQuantity || 0

      // total capital for this batch
      const capital = purchase.price || 0

      // total sales for this batch
      const totalSalesData = await salesModel.aggregate([
        {$match: {purchaseId}},
        {$group: {_id: null, totalSales: {$sum: "$totalPrice"}}}
      ])
      const totalSales = totalSalesData[0]?.totalSales || 0

      // total mortality for this batch
      const totalMortalityData = await mortalityModel.aggregate([
        {$match: {purchaseId}},
        {$group: {_id: null, totalMortality: {$sum: "$mortalityRate"}}}
      ])
      const totalMortality = totalMortalityData[0]?.totalMortality || 0

      // revenue and net profit
      const revenue = totalSales

      const netProfit = revenue - capital

      // upsert the summary for this purchaseId
      const summary = await summaryModel.findOneAndUpdate(
        {purchaseId}, // match this purchase batch
        {
          $set: {
            totalFeeds,
            capital,
            totalSales,
            totalMortality,
            revenue,
            netProfit,
            startDate: purchase.dateOfPurchase
          }
        },
        {
          new: true,
          upsert: true
        }
      )
      summaries.push(summary)
    } 
    return summaries
  }
  catch(err){
    console.error(chalk.hex("#ff2425")("Error updating summary: ", err.message))
  //     throw new Error("Failed to update summary")
  }
}

    



    // try {
    //     // calculate total feeds 
    //     const totalFeedsData = await feedsModel.aggregate([
    //         {$group: {_id: null, totalQuantity: {$sum: "$quantity"}}}
    //     ])
    //     const totalFeeds = totalFeedsData[0]?.totalQuantity || 0

    //     // total purchase
    //     const totalCapitalData = await purchaseModel.aggregate([
    //         {$group: {_id: null, totalCapital: {$sum: "$price"}}}
    //     ])
    //     const capital = totalCapitalData[0].totalCapital || 0

    //     // total sales revenue 
    //     const totalSalesData = await salesModel.aggregate([
    //         {$group: {_id: null, totalSales: {$sum: "$totalPrice"}}}
    //     ])
    //     const totalSales = totalSalesData[0]?.totalSales || 0

    //     // total mortality
    //     const totalMortalityData = await mortalityModel.aggregate([
    //         {$group: {_id: null, totalMortality: {$sum: "$mortalityRate"}}}
    //     ])
    //     const totalMortality = totalMortalityData[0]?.totalMortality || 0

    //     // revenue = sales income // total sales in all
    //     const revenue = totalSales

    //     // net profit = revenue - capital 
    //     const netProfit = revenue - capital

    //     // update summary 
    //     const summary = await summaryModel.findOneAndUpdate(
    //         {}, // update first document
    //         {
    //             $set: {
    //                 totalFeeds,
    //                 capital,
    //                 totalSales,
    //                 totalMortality,
    //                 revenue,
    //                 netProfit
    //                 // calculate the rest records here
    //             }
    //         },
    //         {
    //             new: true,
    //             upsert: true
    //         }
    //     )
    //     return summary
    //  catch(err){
    //     console.error(chalk.hex("#ff2425")("Error updating summary: ", err.message))
    //     throw new Error("Failed to update summary")
    // }

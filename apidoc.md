
* [dev-server]
# https://farm-database.onrender.com/
* [local-server]
# http://localhost:1960/
<!-- /////////////////post ////////////////// -->

(post)
# http://localhost:1960/chicken-api/batch
* {
    "name": "Batch F",
    "description": "This is my sixeth poultry batch"
}
# (response)
* {
    "message": "New batch created",
    "data": {
        "name": "Batch F",
        "description": "This is my sixeth poultry batch",
        "status": "Active",
        "_id": "68a3466a34f621808c393f65",
        "startDate": "2025-08-18T16:27:38.582Z",
        "createAt": "2025-08-18T16:27:38.590Z"
    }
}


(post)
# http://localhost:1960/chicken-api/purchase
* {
    "quantity": 520,
    "price": 500000,
    "batchId": "689fb7ff65c1f388a6192dcf",
    "purchaseId": "689fb8d465c1f388a6192dd3"
}
# (response)
* {
    "message": "Purchase record created successfully",
    "data": {
        "batchId": "689fb7ff65c1f388a6192dcf",
        "purchaseId": "689fb8d465c1f388a6192dd3",
        "quantity": 520,
        "price": 500000,
        "pricePerChick": 961.5384615384615,
        "_id": "68a3424a64166865d64fe925",
        "dateOfPurchase": "2025-08-18T15:10:02.243Z",
        "daysSincePurchase": 0,
        "dateOfPurchaseFormatted": "18/08/2025, 16:10:02"
    }
}


(post)
# http://localhost:1960/chicken-api/feeds
* {
    "quantity": 10,
    "totalPrice": 110000,
    "batchId": "689fb79565c1f388a6192dcc",
    "purchaseId": "689fb8d465c1f388a6192dd3"
} 
# (response)
* {
    "message": "Feed record created successfully",
    "data": {
        "batchId": "689fb79565c1f388a6192dcc",
        "purchaseId": "689fb8d465c1f388a6192dd3",
        "quantity": 10,
        "totalPrice": 110000,
        "pricePerFeed": 11000,
        "_id": "68a33d9164166865d64fe909",
        "date": "18/08/2025, 15:49:53"
    }
}

(post)
# http://localhost:1960/chicken-api/vaccine
* {
    "vaccineName": "gomboro",
    "vaccinePrice": 3000,
    "quantity": 3,
    "batchId": "689fb79565c1f388a6192dcc"
    "purchaseId": "689fb8d465c1f388a6192dd3"
}
# (response)
* {
    "message": "New vaccine record taken successfully",
    "data": {
        "batchId": "689fb79565c1f388a6192dcc",
        "vaccineName": "gomboro",
        "vaccinePrice": 3000,
        "quantity": 3,
        "totalAmount": 9000,
        "_id": "68a3489934f621808c393f67",
        "date": "18/08/2025, 16:36:57"
    }
}


(post)
# http://localhost:1960/chicken-api/sales
* {
    "numberSold": 1,
    "totalPrice": 12000,
    "batchId": "689fb79565c1f388a6192dcc",
    "purchaseId": "689fb8d465c1f388a6192dd3"
}
# (response)
* {
    "message": "New sale record",
    "data": {
        "batchId": "689fb79565c1f388a6192dcc",
        "purchaseId": "689fb8d465c1f388a6192dd3",
        "numberSold": 1,
        "totalPrice": 12000,
        "pricePerSale": 12000,
        "date": "18/08/2025, 16:02:14",
        "age": 2,
        "_id": "68a3407664166865d64fe91d"
    }
}

(post)
# http://localhost:1960/chicken-api/mortality
* {
    "mortalityRate": 2,
    "batchId": "689fb79565c1f388a6192dcc",
    "purchaseId": "68a12f0394723e99cf8dc3e7"
}
# (response)
* {
    "message": "New record of mortality taken:",
    "data": {
        "batchId": "689fb79565c1f388a6192dcc",
        "purchaseId": "68a12f0394723e99cf8dc3e7",
        "mortalityRate": 2,
        "mortalityAge": 1,
        "_id": "68a3410164166865d64fe922",
        "date": "18/08/2025, 16:04:33"
    }
}

(post)



<!-- ///////////////get /////////////// -->
(get)
# http://localhost:1960/chicken-api/all-records/689fb79565c1f388a6192dcc
* all sum records belonging to a purchase

(get)
# http://localhost:1960/chicken-api/feeds-total/689fb79565c1f388a6192dcc
* total feeds and their prices for a given batch or sale

(get)
# http://localhost:1960/chicken-api/sales/689fb79565c1f388a6192dcc
* total sales for a given purchase and batch

(get)
# http://localhost:1960/chicken-api/mortality/689fb79565c1f388a6192dcc
* total mortalities for a given purchase and batch

(get)
# http://localhost:1960/chicken-api/purchase/689fb79565c1f388a6192dcc
* total purchase for a given batch

(get)
# http://localhost:1960/chicken-api/vaccine/689fb79565c1f388a6192dcc
* total vaccines for a given batch / purchase

(GET)
# http://localhost:1960/chicken-api/batch
* list of all batches by a user

(get)
# http://localhost:1960/chicken-api/batch/689fb79565c1f388a6192dcc
* get purchase by its id

(get)
# http://localhost:1960/chicken-api/batchdata/689fb79565c1f388a6192dcc
* calculations from all the lists in batch. starting from list of all purchases, vaccines, mortalities etc

(get)
# http://localhost:1960/chicken-api/sale-summary/689fb79565c1f388a6192dcc
* list of all the sales. calculation

(get)
# http://localhost:1960/chicken-api/mortality-sum/689fb79565c1f388a6192dcc
* list of all mortality records in the database. calculation

(get)
# http://localhost:1960/chicken-api/feeds-total/689fb79565c1f388a6192dcc
* list of all feeds bought for a given batch

(get)
# http://localhost:1960/chicken-api/all-records/689fb79565c1f388a6192dcc
* same as batchdata








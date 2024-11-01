require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const videoRoutes = require("./routes/videos");
const cron = require('node-cron');
const {saveUpdateS3Data_OnDB} = require("./service/updateDataS3")

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.log(err));

app.use("/api/videos", videoRoutes);

console.log("process.env.AWS_BUCKET_NAME", process.env.AWS_BUCKET_NAME);

// Schedule the function to run every hour
// cron.schedule('0 * * * *', () => {
//   console.log('Running hourly URL generation job...');
//   saveUpdateS3Data_OnDB(process.env.AWS_BUCKET_NAME);
// });

// Run the function once initially when the server starts
// saveUpdateS3Data_OnDB(process.env.AWS_BUCKET_NAME);
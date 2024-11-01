const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  key: {
    type: String,
    require: true
  },
  date: {
    type: Date,
    require: true
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", VideoSchema);

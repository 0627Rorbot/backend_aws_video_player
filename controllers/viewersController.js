const Video = require("../models/Video");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

exports.saveVideoMetadata = async (req, res) => {
  try {
    const { title, s3_key, thumbnail, subtitles, uploadDate, metadata } = req.body;

    const video = new Video({
      title,
      s3_key,
      thumbnail,
      subtitles,
      uploadDate,
      metadata,
    });

    await video.save();
    res.status(201).json({ message: "Video metadata saved successfully", video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 }); // Latest videos first
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

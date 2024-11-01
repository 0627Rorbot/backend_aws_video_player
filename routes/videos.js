const express = require("express");
const { getRecentVideo, getBeforeVideo, getNextVideo, getLiveVideos, getDateVideo } = require("../controllers/videoController");

const router = express.Router();

router.get("/next", getNextVideo) // Endpoint to fetch video list
      .get("/date", getDateVideo) // Endpoint to fetch video list
      .get("/recent", getRecentVideo) // Endpoint to fetch video list
      .get("/before", getBeforeVideo) // Endpoint to fetch video list
      .get("/live", getLiveVideos) // Endpoint to fetch video list
// router.get("/live", getLiveVideo);
// router.get("/calendar", getVideosByDate);
// router.post("/save", saveVideoMetadata); // New route to save video data
// router.get("/all", getAllVideos); // New route to get all videos

module.exports = router;

require("dotenv").config();

const { status } = require("express/lib/response");
const Video = require("../models/Video");
const {isKeyExistsInS3, generateSignedUrl, readCSVFromS3, readVTTFromS3, listVTTFiles, getAllUrlsinFolder, getDateURLfromKey} = require("../service/s3bucketManager")

exports.getAllVideos = async (req, res) => {
  console.log("here");
  
  try {
    const videos = await Video.find().sort({ uploadDate: -1 }); // Latest videos first
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentVideo = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME

    const videos = await Video.find({}).sort({ date: -1 }); // Latest videos first
    
    const recentvideo = videos && videos.length > 0 ? videos[0] : undefined;
    
    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);
    console.log("subtitleKeyList", subtitleKeyList);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) imageSignedUrl = await generateSignedUrl(bucket, imageKey)
    if(await isKeyExistsInS3(bucket, metadataKey)) {
      // const metadataSignedUrl = await generateSignedUrl(bucket, metadataKey) 
      metadata = await readCSVFromS3(bucket, metadataKey)
      console.log("metadata", metadata);
    }
    if(await isKeyExistsInS3(bucket, subtitleKey)) {
      // const subtitleSignedUrl = await generateSignedUrl(bucket, subtitleKey)
      subtitle = await readVTTFromS3(bucket, subtitleKey)
      console.log("subtitle", subtitle);
    }
    if(await isKeyExistsInS3(bucket, videoKey)) videoSignedUrl = await generateSignedUrl(bucket, videoKey)

    const res_video = {
      key: recentvideo.key,
      date: recentvideo.date,
      image: imageSignedUrl,
      metadata: metadata,
      subtitle: subtitle,
      video: videoSignedUrl
    }

    res.status(200).json({status: true, data: res_video});
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


exports.getVideosByDate = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME
    const date = req.body.date
    const videos = await Video.find({date: date}).sort({ date: 1 }); // Latest videos first
    
    const res_videos = videos.map( async() => {
      try {
        const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);
        console.log("subtitleKeyList", subtitleKeyList);

        const key = recentvideo.key;
        const imageKey = `IMAGE/${key}.jpg`
        const metadataKey = `METADATA/${key}.csv`
        const subtitleKey = `SUBTITLE/${key}-EN.vtt`
        const videoKey = `VIDEO/${key}.mkv`

        let imageSignedUrl = ""
        let metadata = {}
        let subtitle = {}
        let videoSignedUrl = ""

        if(await isKeyExistsInS3(bucket, imageKey)) imageSignedUrl = await generateSignedUrl(bucket, imageKey)
        if(await isKeyExistsInS3(bucket, metadataKey)) {
          // const metadataSignedUrl = await generateSignedUrl(bucket, metadataKey) 
          metadata = await readCSVFromS3(bucket, metadataKey)
          console.log("metadata", metadata);
        }
        if(await isKeyExistsInS3(bucket, subtitleKey)) {
          // const subtitleSignedUrl = await generateSignedUrl(bucket, subtitleKey)
          subtitle = await readVTTFromS3(bucket, subtitleKey)
          console.log("subtitle", subtitle);
        }
        if(await isKeyExistsInS3(bucket, videoKey)) videoSignedUrl = await generateSignedUrl(bucket, videoKey)

        const res_video = {
          key: recentvideo.key,
          date: recentvideo.date,
          image: imageSignedUrl,
          metadata: metadata,
          subtitle: subtitle,
          video: videoSignedUrl
        }

        return res_video
      } catch (error) {
        return null
      }
    })

    const real_videos = res_videos.filter((video) => video !=null)

    res.status(200).json({status: true, data: real_videos});
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};



exports.getBeforeVideo = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME
    console.log(req.query.date);
    const date = req.query.date
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = 0
    for (const video of videos) {
      if (video.date.toISOString() === date) {
        break
      }
      
      index ++
    }
    
    console.log("index", index);

    if(index == 0)
      recentvideo = videos[videos.length-1]
    else recentvideo = videos[index-1]

    console.log(index-1, recentvideo);
    
    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[1]);
    console.log("subtitleKeyList", subtitleKeyList);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) imageSignedUrl = await generateSignedUrl(bucket, imageKey)
    if(await isKeyExistsInS3(bucket, metadataKey)) {
      // const metadataSignedUrl = await generateSignedUrl(bucket, metadataKey) 
      metadata = await readCSVFromS3(bucket, metadataKey)
      console.log("metadata", metadata);
    }
    // if(await isKeyExistsInS3(bucket, subtitleKey)) {
    //   // const subtitleSignedUrl = await generateSignedUrl(bucket, subtitleKey)
    //   subtitle = await readVTTFromS3(bucket, subtitleKey)
    //   console.log("subtitle", subtitle);
    // }
    if(await isKeyExistsInS3(bucket, videoKey)) videoSignedUrl = await generateSignedUrl(bucket, videoKey)

    const res_video = {
      key: recentvideo.key,
      date: recentvideo.date,
      image: imageSignedUrl,
      metadata: metadata,
      subtitle: subtitle,
      video: videoSignedUrl
    }

    res.status(200).json({status: true, data: res_video});
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


exports.getDateVideo = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME
    console.log(req.query.date);
    const date = req.query.date
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = -1, i = 0
    
    for (const video of videos) {
      console.log(video.date.toISOString().split('T')[0], date.split('T')[0]);
      
      if (video.date.toISOString().split('T')[0] === date.split('T')[0]) {
        index = i
        break
      }
      i ++
    }
    
    console.log(index);
    
    if(index == -1) {
      res.status(200).json({status: false});
      return
    }

    recentvideo = videos[index]

    console.log(index, recentvideo);
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);
    console.log("subtitleKeyList", subtitleKeyList);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) imageSignedUrl = await generateSignedUrl(bucket, imageKey)
    if(await isKeyExistsInS3(bucket, metadataKey)) {
      // const metadataSignedUrl = await generateSignedUrl(bucket, metadataKey) 
      metadata = await readCSVFromS3(bucket, metadataKey)
      console.log("metadata", metadata);
    }
    if(await isKeyExistsInS3(bucket, subtitleKey)) {
      // const subtitleSignedUrl = await generateSignedUrl(bucket, subtitleKey)
      subtitle = await readVTTFromS3(bucket, subtitleKey)
      console.log("subtitle", subtitle);
    }
    if(await isKeyExistsInS3(bucket, videoKey)) videoSignedUrl = await generateSignedUrl(bucket, videoKey)

    const res_video = {
      key: recentvideo.key,
      date: recentvideo.date,
      image: imageSignedUrl,
      metadata: metadata,
      subtitle: subtitle,
      video: videoSignedUrl
    }

    res.status(200).json({status: true, data: res_video});
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.getNextVideo = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME
    console.log(req.query.date);
    const date = req.query.date
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = 0
    
    for (const video of videos) {
      if (video.date.toISOString() == date) {
        console.log(video.date.toISOString());
        break
      }
      index ++
    }
    
    if(index < videos.length-1)
      recentvideo = videos[index+1]
    else recentvideo = videos[0]

    console.log(index, recentvideo);
    
    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);
    console.log("subtitleKeyList", subtitleKeyList);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) imageSignedUrl = await generateSignedUrl(bucket, imageKey)
    if(await isKeyExistsInS3(bucket, metadataKey)) {
      // const metadataSignedUrl = await generateSignedUrl(bucket, metadataKey) 
      metadata = await readCSVFromS3(bucket, metadataKey)
      console.log("metadata", metadata);
    }
    if(await isKeyExistsInS3(bucket, subtitleKey)) {
      // const subtitleSignedUrl = await generateSignedUrl(bucket, subtitleKey)
      subtitle = await readVTTFromS3(bucket, subtitleKey)
      console.log("subtitle", subtitle);
    }
    if(await isKeyExistsInS3(bucket, videoKey)) videoSignedUrl = await generateSignedUrl(bucket, videoKey)

    const res_video = {
      key: recentvideo.key,
      date: recentvideo.date,
      image: imageSignedUrl,
      metadata: metadata,
      subtitle: subtitle,
      video: videoSignedUrl
    }

    res.status(200).json({status: true, data: res_video});
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.getLiveVideos = async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME

    const s3_videos = await getAllUrlsinFolder(bucket, "VIDEO/")
    const db_videos = await Video.find({}).sort({date: 1}); // Latest videos first

    for (const s3_video of s3_videos) {
      const dateurl = getDateURLfromKey(s3_video.Key)
      if(!dateurl.status) continue
            
      const is_live = db_videos.filter((db_video) => db_video.date.toISOString() === dateurl.date.toISOString()).length === 0 ? true : false
      if(is_live) {
        console.log(dateurl);
        
        let videoData = {
          key: dateurl.path,
          date: dateurl.date,
          image: "",
          metadata: "",
          subtitle: "",
          video: ""
        };

        const key = dateurl.path;
        const imageKey = `IMAGE/${key}.jpg`
        const metadataKey = `METADATA/${key}.csv`
        const subtitleKey = `SUBTITLE/${key}-EN.vtt`
        const videoKey = `VIDEO/${key}.mkv`

        if(await isKeyExistsInS3(bucket, imageKey)) 
          videoData.imageSignedUrl = await generateSignedUrl(bucket, imageKey)

        if(await isKeyExistsInS3(bucket, metadataKey)) 
          videoData.metadata = await readCSVFromS3(bucket, metadataKey)
        
        if(await isKeyExistsInS3(bucket, subtitleKey)) 
          videoData.subtitle = await readVTTFromS3(bucket, subtitleKey)
        
        if(await isKeyExistsInS3(bucket, videoKey)) 
          videoData.videoSignedUrl = await generateSignedUrl(bucket, videoKey)

        const db_video = new Video({
          key: dateurl.path,
          date: dateurl.date
        });
        await db_video.save();

        res.status(200).json({status: true, data: videoData});
        return
      }
    }

    res.status(200).json({status: false, data: {}});
  } catch (error) {
    console.error("Error fetching video list from S3:", error);
    res.status(500).json({ message: "Error fetching video list" });
  }
};

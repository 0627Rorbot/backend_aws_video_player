require("dotenv").config();
const { MongoClient } = require('mongodb');

const { status } = require("express/lib/response");
const Video = require("../models/Video");
const {isKeyExistsInS3, generateSignedUrl, readCSVFromS3, readVTTFromS3, listVTTFiles, getAllUrlsinFolder, getDateURLfromKey} = require("../service/s3bucketManager")

exports.getAllVideos = async (req, res) => {
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

    const videos = await Video.find({}); // Latest videos first
    
    const recentvideo = videos && videos.length > 0 ? videos[videos.length-1] : undefined;
    
    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);

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
    }
    if(await isKeyExistsInS3(bucket, subtitleKey)) 
      subtitle = await readVTTFromS3(bucket, subtitleKey)
    
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
        if(await isKeyExistsInS3(bucket, metadataKey)) 
          metadata = await readCSVFromS3(bucket, metadataKey)
        
        if(await isKeyExistsInS3(bucket, subtitleKey)) 
          subtitle = await readVTTFromS3(bucket, subtitleKey)
        
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
    const media_key = req.query.key
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = 0
    for (const video of videos) {
      if (video.key === media_key) {
        break
      }
      
      index ++
    }
    
    if(index == 0)
      recentvideo = videos[videos.length-1]
    else recentvideo = videos[index-1]

    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[1]);

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
    const date = req.query.date
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = -1, i = 0
    
    for (const video of videos) {
      if (video.date.toISOString().split('T')[0] === date.split('T')[0]) {
        index = i
        break
      }
      i ++
    }
    
    if(index == -1) {
      res.status(200).json({status: false});
      return
    }

    recentvideo = videos[index]

    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) 
      imageSignedUrl = await generateSignedUrl(bucket, imageKey)

    if(await isKeyExistsInS3(bucket, metadataKey)) 
      metadata = await readCSVFromS3(bucket, metadataKey)
    
    if(await isKeyExistsInS3(bucket, subtitleKey)) 
      subtitle = await readVTTFromS3(bucket, subtitleKey)
    
    if(await isKeyExistsInS3(bucket, videoKey)) 
      videoSignedUrl = await generateSignedUrl(bucket, videoKey)

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
    const media_key = req.query.key
    
    let recentvideo = undefined
    const videos = await Video.find({}).sort({date: 1}); // Latest videos first
    
    if(videos.length == 0 ) {
      res.status(500).json({status: false})
      return
    }
    
    let index = 0
    
    for (const video of videos) {
      if (video.key === media_key) {
        break
      }
      index ++
    }
    
    if(index < videos.length-1)
      recentvideo = videos[index+1]
    else recentvideo = videos[0]

    console.log(index)
    console.log(recentvideo)
    
    if(recentvideo == undefined) {
      res.status(500).json({status: false});
      return
    }
    
    const subtitleKeyList = await listVTTFiles(bucket, recentvideo.key.split("/")[0]);

    const key = recentvideo.key;
    const imageKey = `IMAGE/${key}.jpg`
    const metadataKey = `METADATA/${key}.csv`
    const subtitleKey = `SUBTITLE/${key}-EN.vtt`
    const videoKey = `VIDEO/${key}.mkv`

    let imageSignedUrl = ""
    let metadata = {}
    let subtitle = {}
    let videoSignedUrl = ""

    if(await isKeyExistsInS3(bucket, imageKey)) 
      imageSignedUrl = await generateSignedUrl(bucket, imageKey)
    
    if(await isKeyExistsInS3(bucket, metadataKey)) 
      metadata = await readCSVFromS3(bucket, metadataKey)
    
    if(await isKeyExistsInS3(bucket, subtitleKey)) 
      subtitle = await readVTTFromS3(bucket, subtitleKey)
    
    if(await isKeyExistsInS3(bucket, videoKey)) 
      videoSignedUrl = await generateSignedUrl(bucket, videoKey)

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
  const uri = process.env.MONGO_URI; // Replace with your MongoDB connection string
  const dbName = 'video_db';
  const collectionName = 'videos';
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const bucket = process.env.AWS_BUCKET_NAME
    const s3_videos = await getAllUrlsinFolder(bucket, "VIDEO/")

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.drop()
    // Example data (replace with your actual data)
    const data = [];

    let live_key = '', live_date = ''

    for (const s3_video of s3_videos) {
      date_url = getDateURLfromKey(s3_video.Key)
      live_key = date_url.path
      live_date = date_url.date
      
      data.push({ key: live_key, date: live_date });
    }

    console.log("data", data[data.length - 2])
    console.log("data", data[data.length - 1 ])
    // Insert multiple documents
    const result = await collection.insertMany(data);

    if(result.length === 0) {
      res.status(500).json({status: false, data: []});
      return
    }
    
    let videoData = {
      key: live_key,
      date: live_date,
      image: "",
      metadata: "",
      subtitle: "",
      video: ""
    };

    const imageKey = `IMAGE/${live_key}.jpg`
    const metadataKey = `METADATA/${live_key}.csv`
    const subtitleKey = `SUBTITLE/${live_key}-EN.vtt`
    const videoKey = `VIDEO/${live_key}.mkv`

    if(await isKeyExistsInS3(bucket, imageKey)) 
      videoData.image = await generateSignedUrl(bucket, imageKey)

    if(await isKeyExistsInS3(bucket, metadataKey)) 
      videoData.metadata = await readCSVFromS3(bucket, metadataKey)
    
    if(await isKeyExistsInS3(bucket, subtitleKey)) 
      videoData.subtitle = await readVTTFromS3(bucket, subtitleKey)
    
    if(await isKeyExistsInS3(bucket, videoKey)) 
      videoData.video = await generateSignedUrl(bucket, videoKey)
    
    res.status(200).json({status: true, data: videoData});
  } catch (error) {
    console.error("Error fetching video list from S3:", error);
    res.status(500).json({ message: "Error fetching video list" });
  }
};

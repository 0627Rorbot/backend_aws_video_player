require("dotenv").config();
const { MongoClient } = require('mongodb');

const { getDateURLfromKey, getAllUrlsinFolder } = require("./s3bucketManager")

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);

exports.saveUpdateS3Data_OnDB = async (bucketName) => {
    try {
        await client.connect();
        const db = client.db('video_db');
        const collection = db.collection('videos');

        const allVideos = await getAllUrlsinFolder(bucketName, "VIDEO/")

        // Create a bulk update array
        const bulkUpdates = [];
        
        for (const item of allVideos) {
            const dateurl = getDateURLfromKey(item.Key)
            if(!dateurl.status) continue
            const date = dateurl.date
            const path = dateurl.path

            const videoData = {
                key: path,
                date: date
            };
            // Add each update to the bulkUpdates array
            bulkUpdates.push({
                updateOne: {
                    filter: { key: dateurl.path },
                    update: { $set: videoData },
                    upsert: true
                }
            });
        }
        // Perform bulk update
        if (bulkUpdates.length > 0) {
            await collection.bulkWrite(bulkUpdates);
        }
        console.log("Saved signed URL on Database");
    } catch (error) {
        console.error('Error generating and saving signed URLs:', error);
    } finally {
        // Close MongoDB connection
        await client.close();
    }
};

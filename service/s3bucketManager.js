require("dotenv").config();

const { S3Client, HeadObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { Readable } = require('stream');
const { parse } = require('date-fns');
const path = require('path');
const csv = require('csv-parser');

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


exports.isKeyExistsInS3 = async (bucketName, key) => {
  const params = {
      Bucket: bucketName,
      Key: key
  };

  try {
      await s3Client.send(new HeadObjectCommand(params));
      return true; // Object exists
  } catch (error) {
      if (error.name === 'NotFound') {
          return false; // Object does not exist
      }
      throw error;
  }
};

// Function to generate a signed URL
exports.generateSignedUrl = async (bucketName, key) => {
  try {    
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
  
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 * 24 });
      
      return signedUrl;
    } catch (error) {
      return ""
  }
};

exports.getDateURLfromKey = (s3Key) => {
  // Extracts directory and filename without extension
  const parsedPath = path.parse(s3Key);

  // Combine the parent directory and filename without the extension
  const match = parsedPath.dir.match(/VIDEO\/(\d{4})/);

  if (match) {
      const year = match[1];
      const filenameWithoutExt = parsedPath.name;

      // Remove the suffix "S1" by splitting the string
      const dateString = filenameWithoutExt.split('-S')[0]; // "2024/20241016-1458"
      const filtereddate = parse(dateString, 'yyyyMMdd-HHmm', new Date());
      
      // Return the year and filename in the desired format
      return {
          status: true,
          date: filtereddate,
          path: `${year}/${filenameWithoutExt}`
      };
  }

  // Return empty string if the regex doesn't match
  return {
      status: false
  };
}

exports.getAllUrlsinFolder = async(bucketName, folder) => {
    let continuationToken;
    let allUrls = [];

    try {
        do {
            const params = {
                Bucket: bucketName,
                Prefix: folder, // Filter to only include objects in the "video" folder
                ContinuationToken: continuationToken
            };
            // List objects in the bucket with the specified prefix
            const data = await s3Client.send(new ListObjectsV2Command(params));
            allUrls = [...allUrls, ...data.Contents]

            continuationToken = data.IsTruncated ? data.NextContinuationToken : null;
        } while (continuationToken);

        return allUrls;
    } catch (err) {
        return [];
    }
}

exports.readCSVFromS3 = async(bucketName, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);

  try {
    // Fetch the file from S3
    const response = await s3Client.send(command);

    // Convert the S3 Body (ReadableStream) to a readable Node.js stream
    const s3Stream = Readable.from(response.Body);

    let csvData = {};

    // Parse the CSV data
    return new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', (row) => {
          csvData = row;
        })
        .on('end', () => {
          resolve(csvData); // Resolve with the parsed CSV data
        })
        .on('error', (error) => {
          reject(error); // Handle any parsing errors
        });
    });
  } catch (error) {
    throw error;
  }
}

exports.readVTTFromS3 = async (bucketName, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);

  try {
    // Fetch the VTT file from S3
    const response = await s3Client.send(command);

    // Convert the response Body (ReadableStream) into a string
    const vttContent = await streamToString(response.Body);

    // Parse the VTT content
    const parser = new WebVTTParser();
    const parsedData = parser.parse(vttContent);

    // Convert the parsed data into JSON format
    const jsonData = parsedData.cues.map((cue) => ({
      start: cue.startTime,
      end: cue.endTime,
      text: cue.text,
    }));

    return jsonData;
  } catch (error) {
    throw error;
  }
}

// Helper function to convert stream to string
const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}


exports.listVTTFiles = async (bucketName, searchString) => {
  const params = {
    Bucket: bucketName,
    Prefix: 'SUBTITLE/', // Specifies the folder in which to search
  };

  try {
    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);

    // Filter files by .vtt extension and presence of searchString in the Key
    const filteredFiles = response.Contents.filter((item) => {
      return item.Key.endsWith('.vtt') && item.Key.includes(searchString);
    }).map((item) => item.Key); // Map to get only the keys

    return filteredFiles;
  } catch (error) {
    throw error;
  }
}

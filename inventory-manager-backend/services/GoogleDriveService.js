const fs = require('fs');
const { google } = require('googleapis');

// Load Google Drive API credentials
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Configure auth client
const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth });

// Upload a file to Google Drive
exports.uploadFile = async (filePath, fileName) => {
  try {
    const fileMetadata = {
      name: fileName,
      parents: ['root'] // Upload to root folder
    };
    const media = {
      body: fs.createReadStream(filePath)
    };
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    console.log(`File uploaded to Google Drive: ${response.data.id}`);
  } catch (err) {
    console.error('Error uploading file to Google Drive:', err);
  }
};
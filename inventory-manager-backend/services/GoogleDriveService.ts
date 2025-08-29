import fs from 'fs';
import { google } from 'googleapis';

// Load Google Drive API credentials
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

// Configure auth client
const auth = new google.Auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth });

// Upload a file to Google Drive
export const uploadFile = async (filePath: string, fileName: string): Promise<void> => {
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
    } as any);
    console.log(`File uploaded to Google Drive: ${response.data.id}`);
  } catch (err) {
    console.error('Error uploading file to Google Drive:', err);
  }
};
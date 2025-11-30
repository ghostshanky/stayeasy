import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ImageKit upload function
async function uploadToImageKit(filePath, fileName) {
  try {
    // Read the file as base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64File = fileBuffer.toString('base64');

    // ImageKit API endpoint
    const url = 'https://upload.imagekit.io/api/v1/files/upload';

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', base64File);
    formData.append('fileName', fileName);
    formData.append('useUniqueFileName', 'false');
    formData.append('tags', 'vesta,logo');
    formData.append('folder', '/assets');
    formData.append('isPrivateFile', 'false');
    formData.append('responseFields', 'url,fileId,name');

    // Make the request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from('private_AgiZiAJZATbo2Zfan/YCQ3DfMOs=' + ':').toString('base64')}`,
      },
      body: formData,
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
    }

    console.log('Upload successful!');
    console.log('URL:', data.url);
    console.log('File ID:', data.fileId);
    console.log('Name:', data.name);

    return data;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const filePath = path.join(__dirname, 'VESTA.png');
  const fileName = 'VESTA.png';

  console.log('Uploading VESTA.png to ImageKit...');

  try {
    const result = await uploadToImageKit(filePath, fileName);
    console.log('✅ Successfully uploaded VESTA.png to ImageKit');
    console.log('Image URL:', result.url);
  } catch (error) {
    console.error('❌ Failed to upload VESTA.png:', error.message);
    process.exit(1);
  }
}

main();

import fs from 'fs';

const filePath = './pages/ProfilePage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing ProfilePage.tsx...');

// Fix 1: Store imageUrl from response
content = content.replace(
    'setImageId(data.imageId);',
    'setImageId(data.imageUrl || data.imageId);'
);

// Fix 2: Check if imageId is a full URL before constructing ImageKit URL
content = content.replace(
    '? `${IMAGEKIT_URL_ENDPOINT}/assets/${imageId}`',
    "? (imageId.startsWith('http') ? imageId : `${IMAGEKIT_URL_ENDPOINT}/assets/${imageId}`)"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed! Now refresh your browser and upload an image.');

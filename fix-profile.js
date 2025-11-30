const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'ProfilePage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing ProfilePage.tsx...');

// Fix 1: Replace ImageKit import with Cloudinary
content = content.replace(
    /const IMAGEKIT_URL_ENDPOINT = import\.meta\.env\.VITE_IMAGEKIT_URL_ENDPOINT \|\| "https:\/\/ik\.imagekit\.io\/Shanky";/,
    'import { useDarkMode } from "../client/src/contexts/DarkModeContext";\nimport { getCloudinaryUrl } from "../components/CloudinaryImage";'
);

// Fix 2: Store imageUrl instead of imageId
content = content.replace(
    'setImageId(data.imageId);',
    'setImageId(data.imageUrl || data.imageId);'
);

// Fix 3: Fix displayImage to use Cloudinary
content = content.replace(
    /const displayImage = localPreview\s*\?\s*localPreview\s*:\s*imageId\s*\?\s*`\$\{IMAGEKIT_URL_ENDPOINT\}\/assets\/\$\{imageId\}`\s*:\s*"\/default-avatar\.svg";/,
    `const displayImage = localPreview
    ? localPreview
    : imageId
      ? (imageId.startsWith('http') ? imageId : getCloudinaryUrl(imageId, 500, 500))
      : "/default-avatar.svg";`
);

// Fix 4: Add dark mode to loading state
content = content.replace(
    '<div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8 md:p-10">',
    '<div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-10">'
);

content = content.replace(
    '<p className="mt-4 text-gray-600">Loading profile...</p>',
    '<p className="mt-4 text-gray-600 dark:text-gray-300">Loading profile...</p>'
);

// Fix 5: Add dark mode to main container
content = content.replace(
    '<h1 className="text-3xl font-bold text-gray-800">My Profile</h1>',
    '<h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>'
);

content = content.replace(
    '<p className="text-gray-500 text-sm">Manage your account details and preferences</p>',
    '<p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account details and preferences</p>'
);

// Fix 6: Add useDarkMode hook usage
content = content.replace(
    'const { user: authUser, isAuthenticated } = useAuth();',
    'const { user: authUser, isAuthenticated } = useAuth();\n  const { isDarkMode } = useDarkMode();'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ ProfilePage.tsx fixed!');
console.log('📝 Changes made:');
console.log('  - Switched from ImageKit to Cloudinary');
console.log('  - Added dark mode support');
console.log('  - Fixed image display logic');

import React from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';

const cld = new Cloudinary({
    cloud: {
        cloudName: 'degncsmrz'
    }
});

interface CloudinaryImageProps {
    publicId: string;
    width?: number;
    height?: number;
    alt?: string;
    className?: string;
    fallbackSrc?: string;
}

export default function CloudinaryImage({
    publicId,
    width = 500,
    height = 500,
    alt = 'Image',
    className = '',
    fallbackSrc = '/default-avatar.svg'
}: CloudinaryImageProps) {
    // If no publicId provided, show fallback
    if (!publicId) {
        return <img src={fallbackSrc} alt={alt} className={className} />;
    }

    try {
        const img = cld
            .image(publicId)
            .format('auto') // Optimize delivery by applying auto-format
            .quality('auto') // Apply auto-quality
            .resize(auto().gravity(autoGravity()).width(width).height(height)); // Auto-crop to aspect ratio

        return <AdvancedImage cldImg={img} alt={alt} className={className} />;
    } catch (error) {
        console.error('Error loading Cloudinary image:', error);
        return <img src={fallbackSrc} alt={alt} className={className} />;
    }
}

// Helper function to get Cloudinary URL for a public ID
export function getCloudinaryUrl(publicId: string, width = 500, height = 500): string {
    if (!publicId) return '/default-avatar.svg';

    const img = cld
        .image(publicId)
        .format('auto')
        .quality('auto')
        .resize(auto().gravity(autoGravity()).width(width).height(height));

    return img.toURL();
}

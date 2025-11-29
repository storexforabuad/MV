import { SocialPlatform, PlatformConfig } from '@/types/socialPost';
import { toast } from 'react-hot-toast';

/**
 * Platform configurations with character limits and features
 */
export const platformConfigs: PlatformConfig[] = [
    {
        name: 'Facebook',
        icon: '📘',
        color: '#1877F2',
        maxCaptionLength: 63206,
        maxHashtags: 30,
        supportsImages: true,
    },
    {
        name: 'Instagram',
        icon: '📷',
        color: '#E4405F',
        maxCaptionLength: 2200,
        maxHashtags: 30,
        supportsImages: true,
    },
    {
        name: 'X',
        icon: '🐦',
        color: '#000000',
        maxCaptionLength: 280,
        maxHashtags: 10,
        supportsImages: true,
    },
    {
        name: 'WhatsApp',
        icon: '💬',
        color: '#25D366',
        maxCaptionLength: 65536,
        maxHashtags: 10,
        supportsImages: true,
    },
];

/**
 * Gets configuration for a specific platform
 */
export function getPlatformConfig(platform: SocialPlatform): PlatformConfig {
    return platformConfigs.find(p => p.name === platform) || platformConfigs[0];
}

/**
 * Truncates caption to fit platform's character limit
 */
export function truncateCaptionForPlatform(
    caption: string,
    platform: SocialPlatform
): string {
    const config = getPlatformConfig(platform);
    if (caption.length <= config.maxCaptionLength) {
        return caption;
    }

    return caption.slice(0, config.maxCaptionLength - 3) + '...';
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Caption copied to clipboard!');
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('Failed to copy caption');
        return false;
    }
}

/**
 * Downloads an image from a URL
 */
export async function downloadImage(imageUrl: string, filename: string = 'product-image.jpg'): Promise<boolean> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(link.href);
        toast.success('Image downloaded!');
        return true;
    } catch (error) {
        console.error('Failed to download image:', error);
        toast.error('Failed to download image');
        return false;
    }
}

/**
 * Gets platform-specific emoji for visual representation
 */
export function getPlatformEmoji(platform: SocialPlatform): string {
    const config = getPlatformConfig(platform);
    return config.icon;
}

/**
 * Counts hashtags in caption
 */
export function countHashtags(caption: string): number {
    const hashtagRegex = /#\w+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.length : 0;
}

/**
 * Validates caption for a platform
 */
export function validateCaption(caption: string, platform: SocialPlatform): {
    valid: boolean;
    errors: string[];
} {
    const config = getPlatformConfig(platform);
    const errors: string[] = [];

    // Check length
    if (caption.length > config.maxCaptionLength) {
        errors.push(`Caption exceeds ${config.maxCaptionLength} character limit for ${platform}`);
    }

    // Check hashtags
    const hashtagCount = countHashtags(caption);
    if (hashtagCount > config.maxHashtags) {
        errors.push(`Too many hashtags (${hashtagCount}/${config.maxHashtags}) for ${platform}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Gets character count display text
 */
export function getCharacterCountText(caption: string, platform: SocialPlatform): string {
    const config = getPlatformConfig(platform);
    const remaining = config.maxCaptionLength - caption.length;

    // For platforms with very high limits, don't show count
    if (config.maxCaptionLength > 10000) {
        return '';
    }

    return `${caption.length}/${config.maxCaptionLength}`;
}

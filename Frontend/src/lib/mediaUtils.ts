/**
 * Utility to determine if a URL or File is a video vs an image.
 */

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v|ogv)(\?|$)/i;
const VIDEO_MIMETYPES = /^video\//i;

/**
 * Checks if a URL points to a video file.
 */
export function isVideoUrl(url: string): boolean {
    if (!url) return false;
    // Direct upload to Supabase storage with video path
    if (url.includes('/upload-video/') || url.includes('/videos/')) return true;
    // Common video extensions
    if (VIDEO_EXTENSIONS.test(url)) return true;
    // Supabase storage with video MIME hint in URL
    if (url.includes('.supabase.co/storage') && url.includes('video')) return true;
    return false;
}

/**
 * Checks if a File object is a video.
 */
export function isVideoFile(file: File): boolean {
    return VIDEO_MIMETYPES.test(file.type);
}

/**
 * Returns 'video' or 'image' for a given URL.
 */
export function getMediaType(url: string): 'video' | 'image' {
    return isVideoUrl(url) ? 'video' : 'image';
}

/**
 * Applies a diagonal watermark to an image file.
 * Format: Custom text provided as argument
 */
export async function applyWatermark(file: File, watermarkText: string): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Watermark settings
            const text = watermarkText;

            // Dynamic font size - reduced to 0.032 for a more elegant, professional scale
            const fontSize = Math.floor(Math.max(canvas.width, canvas.height) * 0.032);

            // Use weight 700 (Bold) instead of 900 (Black) to match the sample's cleaner lines
            // Inter is the primary font, falling back to system sans-serifs
            ctx.font = `700 ${fontSize}px Inter, "Segoe UI", Roboto, system-ui, sans-serif`;

            // Save state for rotation
            ctx.save();

            // Move to center and rotate
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4); // 45 degrees diagonal

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Set global transparency - 0.4 provides good visibility without being distracting
            ctx.globalAlpha = 0.4;

            // Subtle shadow for depth
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = fontSize / 15;
            ctx.shadowOffsetX = fontSize / 30;
            ctx.shadowOffsetY = fontSize / 30;

            // Thinner outline for a sharper, more professional look
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = fontSize / 20;
            ctx.strokeText(text, 0, 0);

            // Main text fill
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillText(text, 0, 0);

            ctx.restore();

            // Convert back to file
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(objectUrl);
                if (!blob) {
                    reject(new Error('Canvas toBlob failed'));
                    return;
                }
                const watermarkedFile = new File([blob], file.name, { type: file.type });
                resolve(watermarkedFile);
            }, file.type, 0.9); // High quality
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
}

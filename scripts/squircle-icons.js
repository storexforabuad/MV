const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '../public/icons');

async function processIcons() {
    const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png') && !f.startsWith('temp_'));

    for (const file of files) {
        const filePath = path.join(iconsDir, file);
        const tempPath = path.join(iconsDir, `temp_${file}`);

        try {
            // Read the image to get its dimensions
            const metadata = await sharp(filePath).metadata();
            const size = metadata.width;

            // Create a squircle SVG mask (iOS standard is typically ~22.5% border radius)
            const rx = size * 0.225;

            const svgMask = `
        <svg width="${size}" height="${size}">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#ffffff" />
        </svg>
      `;

            // Apply the mask
            await sharp(filePath)
                .composite([{
                    input: Buffer.from(svgMask),
                    blend: 'dest-in'
                }])
                .png()
                .toFile(tempPath);

            // Replace original with squircled version
            fs.renameSync(tempPath, filePath);
            console.log(`Successfully processed ${file}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

processIcons().then(() => console.log('All icons processed!')).catch(console.error);

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAdditionalIcons() {
  const logoPath = path.join(__dirname, '../public/logo3.png');
  const iconsDir = path.join(__dirname, '../public/icons');
  
  console.log('Generating additional PWA icons...');
  
  try {
    // Generate missing favicon sizes
    await sharp(logoPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(iconsDir, 'icon-16x16.png'));
    console.log('Generated: icon-16x16.png');
    
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(iconsDir, 'icon-32x32.png'));
    console.log('Generated: icon-32x32.png');
    
    // Generate Apple startup images
    const startupSizes = [
      { width: 750, height: 1334, name: 'apple-touch-startup-image-750x1334.png' },
      { width: 828, height: 1792, name: 'apple-touch-startup-image-828x1792.png' },
    ];
    
    for (const size of startupSizes) {
      const logoSize = Math.floor(Math.min(size.width, size.height) * 0.3);
      
      await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
      })
      .composite([{
        input: await sharp(logoPath)
          .resize(logoSize, logoSize)
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(iconsDir, size.name));
      
      console.log('Generated:', size.name);
    }
    
    console.log('✅ Additional icons generated successfully!');
    
  } catch (error) {
    console.error('Error generating additional icons:', error);
  }
}

generateAdditionalIcons(); 
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Shortcut icon sizes
const shortcutSizes = [192];

async function generateIcons() {
  // Create icons directory if it doesn't exist
  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Use the existing logo
  const logoPath = path.join(__dirname, '../public/logo3.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error('Logo file not found at:', logoPath);
    console.log('Available files in public directory:');
    const publicFiles = fs.readdirSync(path.join(__dirname, '../public'));
    console.log(publicFiles);
    return;
  }

  console.log('Generating PWA icons from:', logoPath);

  try {
    // Generate main app icons
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`Generated: icon-${size}x${size}.png`);
    }

    // Generate shortcut icons (placeholder - you can customize these with specific icons later)
    const shortcuts = ['dashboard', 'leads', 'map', 'calendar'];
    
    for (const shortcut of shortcuts) {
      for (const size of shortcutSizes) {
        const outputPath = path.join(iconsDir, `shortcut-${shortcut}.png`);
        
        await sharp(logoPath)
          .resize(size, size, {
            fit: 'cover',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ quality: 90 })
          .toFile(outputPath);
        
        console.log(`Generated: shortcut-${shortcut}.png`);
      }
    }

    // Generate apple touch icons
    const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
    
    for (const size of appleSizes) {
      const outputPath = path.join(iconsDir, `apple-touch-icon-${size}x${size}.png`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`Generated: apple-touch-icon-${size}x${size}.png`);
    }

    // Generate favicon
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('Generated: favicon.png');
    
    console.log('✅ All PWA icons generated successfully!');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 
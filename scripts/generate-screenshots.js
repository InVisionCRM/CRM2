const sharp = require('sharp');
const path = require('path');

async function generateScreenshots() {
  const imagesDir = path.join(__dirname, '../public/images');
  const logoPath = path.join(__dirname, '../public/logo3.png');
  
  console.log('Generating PWA screenshots...');
  
  try {
    // Generate wide screenshot (desktop)
    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 1 }
      }
    })
    .composite([
      // Background gradient
      {
        input: Buffer.from(`
          <svg width="1280" height="720">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1e1e1e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="1280" height="720" fill="url(#grad)" />
          </svg>
        `),
        top: 0,
        left: 0
      },
      // Logo
      {
        input: await sharp(logoPath).resize(200, 200).toBuffer(),
        top: 100,
        left: 100
      },
      // Title text mockup
      {
        input: Buffer.from(`
          <svg width="800" height="400">
            <text x="0" y="40" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff">
              Roofing Mobile CRM
            </text>
            <text x="0" y="90" font-family="Arial, sans-serif" font-size="24" fill="#d1d5db">
              Mobile-first CRM for roofing contractors
            </text>
            <rect x="0" y="120" width="700" height="200" rx="12" fill="#374151" opacity="0.8"/>
            <text x="20" y="150" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">
              ✓ Manage leads and customers
            </text>
            <text x="20" y="180" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">
              ✓ Schedule appointments
            </text>
            <text x="20" y="210" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">
              ✓ Track project progress
            </text>
            <text x="20" y="240" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">
              ✓ Generate estimates and invoices
            </text>
            <text x="20" y="270" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">
              ✓ Offline-first mobile experience
            </text>
          </svg>
        `),
        top: 200,
        left: 350
      }
    ])
    .png()
    .toFile(path.join(imagesDir, 'screenshot-wide.png'));
    
    console.log('Generated: screenshot-wide.png');
    
    // Generate narrow screenshot (mobile)
    await sharp({
      create: {
        width: 750,
        height: 1334,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 1 }
      }
    })
    .composite([
      // Background gradient
      {
        input: Buffer.from(`
          <svg width="750" height="1334">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#1e1e1e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="750" height="1334" fill="url(#grad)" />
          </svg>
        `),
        top: 0,
        left: 0
      },
      // Status bar mockup
      {
        input: Buffer.from(`
          <svg width="750" height="60">
            <rect width="750" height="60" fill="#000000"/>
            <text x="30" y="35" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
              9:41
            </text>
            <text x="650" y="35" font-family="Arial, sans-serif" font-size="16" fill="#ffffff">
              100%
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      },
      // Header
      {
        input: Buffer.from(`
          <svg width="750" height="100">
            <rect width="750" height="100" fill="#1f2937"/>
            <text x="30" y="65" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">
              Dashboard
            </text>
          </svg>
        `),
        top: 60,
        left: 0
      },
      // Logo
      {
        input: await sharp(logoPath).resize(120, 120).toBuffer(),
        top: 200,
        left: 315
      },
      // Content cards mockup
      {
        input: Buffer.from(`
          <svg width="690" height="800">
            <rect x="0" y="0" width="690" height="120" rx="12" fill="#374151"/>
            <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
              Today's Schedule
            </text>
            <text x="20" y="55" font-family="Arial, sans-serif" font-size="14" fill="#d1d5db">
              3 appointments scheduled
            </text>
            <text x="20" y="80" font-family="Arial, sans-serif" font-size="14" fill="#60a5fa">
              View all →
            </text>
            
            <rect x="0" y="140" width="690" height="120" rx="12" fill="#374151"/>
            <text x="20" y="170" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
              Recent Leads
            </text>
            <text x="20" y="195" font-family="Arial, sans-serif" font-size="14" fill="#d1d5db">
              5 new leads this week
            </text>
            <text x="20" y="220" font-family="Arial, sans-serif" font-size="14" fill="#60a5fa">
              Manage leads →
            </text>
            
            <rect x="0" y="280" width="690" height="120" rx="12" fill="#374151"/>
            <text x="20" y="310" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
              Project Status
            </text>
            <text x="20" y="335" font-family="Arial, sans-serif" font-size="14" fill="#d1d5db">
              2 active projects
            </text>
            <text x="20" y="360" font-family="Arial, sans-serif" font-size="14" fill="#60a5fa">
              View projects →
            </text>
          </svg>
        `),
        top: 400,
        left: 30
      }
    ])
    .png()
    .toFile(path.join(imagesDir, 'screenshot-narrow.png'));
    
    console.log('Generated: screenshot-narrow.png');
    console.log('✅ PWA screenshots generated successfully!');
    
  } catch (error) {
    console.error('Error generating screenshots:', error);
  }
}

generateScreenshots(); 
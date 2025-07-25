# Purlin CRM - PWA Setup

## Overview
Purlin CRM is now a Progressive Web App (PWA) that provides a native app-like experience on mobile and desktop devices.

## Features

### ✅ **Core PWA Features**
- **Installable** - Users can install the app to their home screen
- **Offline Support** - Basic functionality works without internet
- **App-like Experience** - Full-screen, standalone mode
- **Fast Loading** - Cached resources for quick access
- **Push Notifications** - Ready for future notification features

### 📱 **Mobile Optimizations**
- **Responsive Design** - Works on all screen sizes
- **Touch-friendly** - Optimized for touch interactions
- **Portrait Orientation** - Primary orientation for mobile use
- **Status Bar Styling** - Custom status bar appearance

### 🔧 **Technical Features**
- **Service Worker** - Handles caching and offline functionality
- **Manifest File** - Defines app appearance and behavior
- **Runtime Caching** - Smart caching strategies for different content types
- **Background Sync** - Ready for offline data synchronization

## Installation

### For Users
1. **Mobile (iOS Safari)**
   - Open the app in Safari
   - Tap the Share button
   - Select "Add to Home Screen"
   - Tap "Add"

2. **Mobile (Android Chrome)**
   - Open the app in Chrome
   - Tap the menu (three dots)
   - Select "Add to Home screen"
   - Tap "Add"

3. **Desktop (Chrome/Edge)**
   - Open the app in Chrome or Edge
   - Look for the install icon in the address bar
   - Click "Install"

### For Developers
```bash
# Install dependencies
npm install

# Generate PWA assets
npm run pwa:setup

# Build for production
npm run build

# Start development server
npm run dev
```

## Configuration

### Manifest File (`public/manifest.json`)
- **App Name**: "Purlin CRM"
- **Short Name**: "Purlin"
- **Theme Color**: Black (#000000)
- **Background Color**: Black (#000000)
- **Display Mode**: Standalone
- **Orientation**: Portrait-primary

### Service Worker (`public/sw.js`)
- **Caching Strategy**: Network First for API calls, Cache First for static assets
- **Cache Names**: 
  - `purlin-static-v1.0.2` - Static files
  - `purlin-dynamic-v1.0.2` - Dynamic content
- **Runtime Caching**: Mapbox, Weather API, and general API endpoints

### Next.js Config (`next.config.js`)
- **PWA Plugin**: `@ducanh2912/next-pwa`
- **Development**: PWA disabled in development mode
- **Production**: Full PWA functionality enabled

## Components

### `ServiceWorkerRegistration`
- Registers the service worker
- Handles updates and activation
- Provides console logging for debugging

### `PWAInstallPrompt`
- Shows install prompt when available
- Handles user interaction
- Automatically hides when installed

### `OfflineIndicator`
- Shows offline status
- Appears when internet connection is lost
- Automatically hides when back online

### `usePWA` Hook
- Manages PWA state
- Provides install functionality
- Tracks online/offline status

## Caching Strategy

### Static Assets
- **Strategy**: Cache First
- **Duration**: Until cache is cleared
- **Scope**: Images, icons, CSS, JS files

### API Calls
- **Strategy**: Network First
- **Duration**: 10 minutes
- **Fallback**: Cached response if available

### External APIs
- **Mapbox**: Cache First, 1 year
- **Weather**: Cache First, 30 minutes

## Offline Functionality

### Available Offline
- ✅ Dashboard layout
- ✅ Cached lead data
- ✅ Basic navigation
- ✅ Offline page

### Requires Internet
- ❌ Real-time data updates
- ❌ New lead creation
- ❌ File uploads
- ❌ Email sending

## Testing

### Development
```bash
# Test PWA features in development
npm run dev
# Open in Chrome DevTools > Application tab
```

### Production
```bash
# Build and test production PWA
npm run build
npm run start
# Test on mobile device or Chrome DevTools
```

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit
5. Review PWA score and recommendations

## Troubleshooting

### Common Issues

1. **Install prompt not showing**
   - Ensure HTTPS is enabled
   - Check if app is already installed
   - Verify manifest file is accessible

2. **Service worker not registering**
   - Check browser console for errors
   - Verify service worker file exists
   - Clear browser cache

3. **Offline functionality not working**
   - Check service worker is active
   - Verify caching strategies
   - Test with network throttling

### Debug Commands
```bash
# Clear PWA cache
npm run pwa:clear

# Regenerate PWA assets
npm run pwa:setup

# Check PWA status
# Open Chrome DevTools > Application > Service Workers
```

## Future Enhancements

### Planned Features
- [ ] Push notifications
- [ ] Background sync for offline actions
- [ ] Advanced caching strategies
- [ ] App shortcuts for quick actions
- [ ] Share API integration

### Performance Optimizations
- [ ] Image optimization
- [ ] Code splitting
- [ ] Preloading critical resources
- [ ] Compression strategies

## Version History

### v1.0.2
- ✅ Initial PWA implementation
- ✅ Basic offline support
- ✅ Install prompt
- ✅ Service worker caching
- ✅ Mobile optimizations

---

**Note**: This PWA implementation is designed to be lightweight and focused on core functionality. It provides a solid foundation for future enhancements while maintaining excellent performance and user experience. 
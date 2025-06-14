# Route Planner Setup Guide

This guide explains how to set up the Route Planner feature with Google APIs integration.

## 🚀 Features

- **Client Integration**: Search and select clients from your CRM database
- **Address Autocomplete**: Real-time address suggestions using Google Places API  
- **Route Optimization**: Optimal route calculation using Google Routes API
- **Interactive Map**: Visual route display with drag-and-drop waypoints
- **Drag & Drop Reordering**: Manually reorder route stops with intuitive drag-and-drop
- **Route Comparison**: Compare your custom route with the optimized route
- **Multi-Stop Routes**: Support for unlimited waypoints/stops
- **Real-Time Updates**: Dynamic route recalculation as you modify waypoints
- **Traffic Awareness**: Real-time traffic data for accurate time estimates
- **Recent Addresses**: Saves frequently used addresses locally
- **Mobile Responsive**: Works seamlessly on desktop and mobile with touch support

## 📦 Dependencies

The route planner uses the following key dependencies:

### Core Dependencies
- **Next.js 15.3.3** - React framework
- **React** - UI library
- **TypeScript** - Type safety

### UI Components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **shadcn/ui components** - UI components

### Drag & Drop
- **@dnd-kit/core** - Core drag-and-drop functionality
- **@dnd-kit/sortable** - Sortable list implementation
- **@dnd-kit/utilities** - Utility functions for drag-and-drop

### Google APIs
- **Google Maps JavaScript API** - Interactive mapping
- **Google Routes API** - Route optimization
- **Google Places API** - Address autocomplete
- **Google Directions API** - Route calculations
- **Google Geocoding API** - Reverse geocoding for current location

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Maps Platform APIs** access
3. **Environment variables** configuration

## 🔧 Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

### Step 2: Enable Required APIs

Enable these APIs in your Google Cloud Console:

1. **Routes API** - For route optimization and directions
2. **Places API** - For address autocomplete suggestions
3. **Maps JavaScript API** - For interactive map display
4. **Directions API** - For real-time route calculations
5. **Geocoding API** - For reverse geocoding (current location to address)

```bash
# Using gcloud CLI (optional)
gcloud services enable routes.googleapis.com
gcloud services enable places-backend.googleapis.com
gcloud services enable maps-backend.googleapis.com
gcloud services enable directions-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
```

### Step 3: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. (Recommended) Restrict the API key:
   - **Application restrictions**: HTTP referrers or IP addresses
   - **API restrictions**: Limit to Routes API, Places API, Maps JavaScript API, and Directions API

## 🔐 Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Client-side Google Maps API Key (for interactive map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

⚠️ **Security Note**: You can use the same API key for both server and client-side, but ensure you have proper domain restrictions configured in Google Cloud Console.

## 📊 API Usage & Pricing

### Routes API Pricing
- **Basic requests**: $0.005 per request
- **Advanced requests** (with optimization): $0.01 per request
- **Free tier**: $200 monthly credit

### Places API Pricing  
- **Autocomplete**: $0.00283 per session
- **Free tier**: Covered by monthly credit

### Maps JavaScript API Pricing
- **Map loads**: $0.007 per load
- **Free tier**: 28,500 loads per month

### Directions API Pricing
- **Basic requests**: $0.005 per request
- **Free tier**: Covered by monthly credit

### Geocoding API Pricing
- **Reverse geocoding**: $0.005 per request
- **Free tier**: Covered by monthly credit

### Cost Optimization Tips
1. **Cache results** for repeated route queries
2. **Use session tokens** for Places API
3. **Implement request debouncing** (already included)
4. **Set reasonable rate limits**
5. **Configure domain restrictions** to prevent unauthorized usage

## 🛠 Technical Implementation

### Architecture Overview

```
Frontend (Next.js)
    ↓
Client Selector Component ← API: /api/route-planner/clients
    ↓
Address Autocomplete ← API: /api/places/autocomplete + /api/geocode/reverse  
    ↓
Interactive Map Component ← Google Maps JavaScript API
    ↓
Route Planning ← API: /api/route-planner + Google Directions API
    ↓
Google Routes API
```

### Key Components

1. **ClientSelector** (`/components/route-planner/client-selector.tsx`)
   - Searches CRM database for clients with addresses
   - Provides dropdown with client information
   - Falls back to manual address entry

2. **AddressAutocomplete** (`/components/route-planner/address-autocomplete.tsx`) 
   - Real-time address suggestions
   - Recent addresses cache
   - Current location option with reverse geocoding
   - Fixed focus issues for smooth typing

3. **DraggableWaypoints** (`/components/route-planner/draggable-waypoints.tsx`)
   - Drag-and-drop route stop reordering
   - Touch-friendly mobile support
   - Visual feedback during dragging
   - Prevents dragging start/end points

4. **RouteMap** (`/components/route-planner/route-map.tsx`)
   - Interactive Google Maps integration
   - Drag-and-drop waypoint modification
   - Real-time route optimization
   - Visual route display with custom styling

5. **RouteComparison** (`/components/route-planner/route-comparison.tsx`)
   - Compares custom vs optimized routes
   - Shows time and distance differences
   - Provides option to restore optimized route
   - Visual indicators for better/worse routes

6. **Route Planner Page** (`/app/route-planner/page.tsx`)
   - Tabbed interface for client vs address mode
   - Multi-waypoint support with add/remove functionality
   - Route optimization and results display
   - Integrated drag-and-drop and comparison features

### API Endpoints

1. **GET /api/route-planner/clients**
   - Searches clients/leads with addresses
   - Supports search query and pagination
   - Returns formatted client data

2. **POST /api/places/autocomplete**
   - Google Places API integration
   - Returns address suggestions
   - Handles API errors gracefully

3. **POST /api/route-planner**
   - Optimizes routes using Google Routes API
   - Supports time constraints and traffic
   - Returns optimized route order

4. **POST /api/geocode/reverse**
   - Converts lat/lng coordinates to readable addresses
   - Used for "Use Current Location" feature
   - Handles reverse geocoding API errors gracefully

## 🔍 Usage Instructions

### For Clients Mode:
1. Click **"Clients"** tab
2. Search for clients by name, address, or phone
3. Select clients from dropdown suggestions
4. Add more stops using **"Add Another Stop"**
5. Remove intermediate stops with the X button
6. Set optional departure time
7. Click **"Plan Route"** or use the interactive map

### For Addresses Mode:
1. Click **"Addresses"** tab  
2. Type addresses to see autocomplete suggestions
3. Select from suggestions or enter manually
4. Use **"Current Location"** if needed
5. Add/remove waypoints as needed
6. Click **"Plan Route"** or use the interactive map

### Interactive Map Features:
- **Drag markers** to adjust waypoint locations
- **Auto-route calculation** when waypoints change
- **Add/remove stops** using map controls
- **Real-time optimization** with traffic data
- **Visual route display** with green route line

### Drag & Drop Route Reordering:
- **Drag waypoint handles** (⋮⋮) to reorder intermediate stops
- **Start and end points** are fixed and cannot be moved
- **Visual feedback** shows where waypoints will be dropped
- **Touch support** for mobile devices with long-press to drag
- **Automatic recalculation** when route order changes

### Route Comparison Features:
- **Automatic comparison** when you manually reorder waypoints
- **Time and distance differences** shown with color coding
- **Efficiency indicators** (green for better, orange for worse)
- **Restore optimized route** button when custom route is longer
- **Real-time updates** as you modify your route

### Results Features:
- **Optimized order** with color-coded waypoints
- **Distance and duration** estimates
- **Open in Google Maps** button
- **Copy route details** to clipboard
- **Interactive map view** with route overlay

## 🐛 Troubleshooting

### Common Issues

**"Route planning service is not configured"**
- Check `GOOGLE_MAPS_API_KEY` environment variable
- Verify API key has Routes API enabled

**"Failed to fetch address suggestions"**  
- Verify Places API is enabled
- Check API key restrictions
- Confirm billing is enabled

**"Map Error" or map not loading**
- Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable
- Verify Maps JavaScript API is enabled
- Ensure domain restrictions allow your domain

**Input field focus issues**
- Clear browser cache and reload
- Check console for JavaScript errors
- Verify component mounting properly

**"No routes found"**
- Verify addresses are valid and accessible
- Check if addresses are in supported regions
- Try more specific address details

**Client search returns empty**
- Ensure clients have addresses in database
- Check authentication/permissions
- Verify database connection

### API Limits & Errors

**Rate Limiting**
- Default: 300 requests per minute per API key
- Increase through Google Cloud Console if needed

**Quota Exceeded**
- Monitor usage in Google Cloud Console
- Set up billing alerts
- Implement usage tracking

**Map Loading Issues**
- Check network connectivity
- Verify API key permissions
- Review browser console for errors

## 🔒 Security Best Practices

1. **API Key Security**
   - Never expose API keys in client-side code beyond what's necessary
   - Use environment variables for server-side keys
   - Implement domain/IP restrictions for client-side keys

2. **Authentication**
   - Route planner requires user authentication
   - Client data is filtered by user permissions
   - Session-based access control

3. **Rate Limiting**
   - Implement request debouncing (300ms)
   - Cache autocomplete results
   - Use session tokens for Places API

4. **Client-Side Key Protection**
   - Configure HTTP referrer restrictions
   - Monitor usage regularly
   - Set up alerts for unusual activity

## 📈 Monitoring & Analytics

### Recommended Monitoring

1. **Google Cloud Console**
   - API usage and quotas
   - Error rates and latency
   - Billing and cost tracking

2. **Application Monitoring**
   - Route planning success rates
   - Client search performance
   - Map loading times
   - User engagement metrics

### Cost Optimization

```typescript
// Example: Cache frequently used routes
const routeCache = new Map();
const cacheKey = `${origin}-${destination}-${intermediate}`;
if (routeCache.has(cacheKey)) {
  return routeCache.get(cacheKey);
}

// Example: Debounce map route calculations
const debouncedCalculateRoute = useCallback(
  debounce(() => calculateRoute(), 500),
  [waypoints]
);
```

## 🆕 New Features

### Interactive Map Features
- **Real-time route visualization** with Google Maps
- **Drag-and-drop waypoints** for instant route updates
- **Multi-stop support** with unlimited waypoints
- **Auto-optimization** when waypoints are modified
- **Traffic-aware routing** for accurate time estimates

### Enhanced User Experience
- **Fixed autocomplete focus issues** for smooth typing
- **Tabbed interface** switching between clients and addresses
- **Dynamic waypoint management** with add/remove functionality
- **Visual feedback** with loading states and error handling
- **Responsive design** works on all screen sizes

### Planned Future Enhancements
- **Saved route templates** for frequently used routes
- **Calendar integration** for appointment routing
- **Vehicle type optimization** (truck routes, avoid tolls, etc.)
- **Real-time tracking** integration
- **Batch route optimization** for multiple vehicles

## 📞 Support

For technical issues:
1. Check console logs for specific error messages
2. Verify Google Cloud API quotas and billing
3. Test API endpoints directly for debugging
4. Review environment variable configuration
5. Check network connectivity for map loading issues

For API-specific issues:
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Support](https://cloud.google.com/support)

---

*Last updated: January 2025* 
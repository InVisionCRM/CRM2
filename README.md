# 🏠 Roofing Mobile CRM

A mobile-first CRM application built specifically for roofing contractors. Manage leads, appointments, files, and more from any device.

**Current Version: v1.02**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (we use Neon)
- Vercel account (for Blob storage)

### Setup

1. Clone the repo
\`\`\`bash
git clone https://github.com/your-username/roofing-mobile-crm.git
cd roofing-mobile-crm
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Fill in your environment variables:
\`\`\`
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"

# Weather API
NEXT_PUBLIC_WEATHER_API_KEY="your-weather-api-key"

# JWT Secret
JWT_SECRET="your-secret-key"
\`\`\`

5. Run database migrations
\`\`\`bash
npx prisma migrate dev
\`\`\`

6. Start the development server
\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Progressive Web App (PWA)

This CRM is available as a Progressive Web App, providing a native app-like experience:

### PWA Features
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Works without internet connection
- **Fast Loading**: Optimized caching and performance
- **Native Experience**: Full-screen mode without browser UI
- **Automatic Updates**: Seamless background updates

### PWA Installation
- **Android/Chrome**: Tap the install prompt or use browser menu
- **iOS/Safari**: Tap Share button → "Add to Home Screen"
- **Desktop**: Click install button in address bar

### Recent PWA Improvements (v1.02)
- Fixed GlobalStats component not displaying in PWA mode
- Enhanced API route caching strategies for better performance
- Improved authentication handling in PWA environment
- Added comprehensive error handling and retry logic
- Enhanced service worker registration with detailed logging
- Fixed manifest shortcuts to point to correct routes
- Added PWA-specific optimizations for SWR data fetching
- Implemented offline/online status detection
- Added development debugging tools for PWA issues

### Latest Updates (v1.02)
- **Neon UI Design System**: Complete redesign with status-based neon colors and glow effects
- **Enhanced Lead Management**: New tabbed interface with Overview, Insurance, Adjuster, Files, Activities, and Jobs
- **Mobile-First Responsive Design**: Optimized for all screen sizes with collapsible cards
- **Real-time Status Updates**: Dynamic status changes with smooth color transitions
- **Improved Performance**: Lazy loading and optimized animations
- **Better UX**: Streamlined interface with consistent sizing and layout

## 🧰 Features

### Lead Management
- **Neon Status-Based Design**: Visual status indicators with dynamic color themes
- **Responsive Card Layout**: Grid-based layout that adapts to screen size
- **Tabbed Interface**: Organized tabs for Overview, Insurance, Adjuster, Files, Activities, and Jobs
- **Real-time Status Updates**: Live status changes with API integration
- **Mobile-Optimized**: Collapsible cards for mobile, expanded by default on desktop
- **Enhanced UX**: Smooth animations and transitions throughout the interface

### Appointment Scheduling
- Calendar with day, week, and month views
- Schedule and manage appointments
- Weather integration for appointment planning
- Appointment reminders and countdowns

### File Management
- Upload and organize files
- View files by category
- Share files with clients

### Weather Integration
- Real-time weather data
- Weather forecasts for appointment planning
- Weather alerts for service areas

### Financial Tracking
- Track revenue and expenses
- View aging receivables
- Compare performance across periods
- Project future revenue

### Team Performance
- Track sales performance
- Leaderboard for top performers
- Individual performance metrics

### Messaging
- In-app messaging system
- Message notifications
- Contact clients directly

### Quick Links
- Organize frequently used resources
- Categorize links for easy access

### Global Statistics Dashboard
- Real-time lead statistics
- Top performer tracking
- Lead status distribution
- Zip code heat mapping
- Weather integration
- Recent activity monitoring

## 📱 Mobile-First Design
This CRM is designed to work great on mobile devices:
- Responsive design that works on phones, tablets, and desktops
- Bottom navigation for easy thumb access on mobile
- Optimized touch targets for mobile use
- Offline capabilities for field use
- PWA support for native app experience

## 🛠️ Tech Stack
- **Frontend**: React + Next.js App Router (TypeScript)
- **UI**: Acernity UI components & Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **File Storage**: Vercel Blob for file/image uploads
- **Authentication**: JWT with HTTP-only cookies
- **PWA**: Next.js PWA with Workbox caching
- **State Management**: SWR for data fetching
- **Animations**: Framer Motion

## 🔐 Authentication

This project uses Google OAuth 2.0 with a refresh token strategy for secure, long-lived user sessions.

### Flow
1.  **Login**: User is redirected to Google's consent screen via `/api/auth/login`.
2.  **Callback**: After granting permission, Google redirects to `/api/auth/callback`. The app exchanges the authorization code for an `access_token` and a `refresh_token`.
3.  **Token Storage**:
    *   `access_token`: A short-lived token stored in a secure, `HttpOnly` cookie.
    *   `refresh_token`: A long-lived token stored in a secure, `HttpOnly` cookie. Used to get new access tokens without requiring the user to log in again.
    *   `access_token_expiry`: The expiration timestamp of the access token, stored in a regular cookie accessible to the client-side.
4.  **Token Refresh**: The client-side `useAuth` hook checks if the access token is nearing expiration. If so, it silently calls `/api/auth/refresh` which uses the `refresh_token` to get a new `access_token`.
5.  **Logout**: `/api/auth/logout` revokes the refresh token with Google and clears all authentication cookies.

### Environment Variables

Add the following to your `.env.local` file:

```
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback" # Use your actual production URL in production
```

### Cookie Details

| Cookie Name             | Purpose                       | Type       | Expiration (Max Age) |
| ----------------------- | ----------------------------- | ---------- | -------------------- |
| `access_token`          | Authenticates API requests    | `HttpOnly` | 1 hour               |
| `refresh_token`         | Obtains new access tokens     | `HttpOnly` | 30+ days             |
| `access_token_expiry`   | Client-side expiration check  | Standard   | 30+ days             |

*   **HttpOnly**: Prevents access from client-side JavaScript, mitigating XSS attacks.
*   **Secure**: Sent only over HTTPS (in production).
*   **SameSite=Lax**: Provides protection against CSRF attacks.

## 📂 Project Structure

\`\`\`
roofing-mobile-crm/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── (protected)/        # Protected routes
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── leads/              # Leads pages
│   ├── financial-health/   # Financial pages
│   ├── team-performance/   # Team pages
│   ├── quick-links/        # Quick links pages
│   ├── recent-activity/    # Activity pages
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── appointments/       # Appointment components
│   ├── calculator/         # Calculator components
│   ├── dashboard/          # Dashboard components
│   ├── files/              # File components
│   ├── financial/          # Financial components
│   ├── leads/              # Lead components
│   ├── messages/           # Message components
│   ├── quick-links/        # Quick link components
│   ├── team/               # Team components
│   ├── ui/                 # UI components
│   └── weather/            # Weather components
├── contexts/               # React contexts
├── hooks/                  # Custom hooks
├── lib/                    # Utility functions
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
└── types/                  # TypeScript types
\`\`\`

## 📋 Version History

### v1.02 (Current)
- **PWA Fixes**: Resolved GlobalStats component not displaying in PWA mode
- **API Caching**: Enhanced caching strategies for better PWA performance
- **Authentication**: Improved auth handling in PWA environment
- **Error Handling**: Added comprehensive error handling and retry logic
- **Service Worker**: Enhanced registration with detailed logging
- **Manifest**: Fixed shortcut URLs to point to correct routes
- **SWR Optimization**: Added PWA-specific configurations
- **Offline Support**: Implemented offline/online status detection
- **Debug Tools**: Added development debugging for PWA issues

### v1.0.0
- Initial release
- Core CRM functionality
- PWA implementation
- Mobile-first design
- Authentication system
- Lead management
- Appointment scheduling
- File management
- Weather integration
- Financial tracking
- Team performance
- Messaging system
- Quick links

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License
[MIT](https://choosealicense.com/licenses/mit/)

## Installation

This project uses npm as the package manager.

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Contributing

Please use npm for package management:

- Use `npm install <package>` to add dependencies
- Commit the updated package-lock.json file
- Do not use yarn or generate yarn.lock files

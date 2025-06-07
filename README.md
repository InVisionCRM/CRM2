# 🏠 Roofing Mobile CRM

A mobile-first CRM application built specifically for roofing contractors. Manage leads, appointments, files, and more from any device.

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

## 🧰 Features

### Lead Management
- View and filter leads by status
- Detailed lead profiles with contact info
- Track lead status history
- Add notes to leads

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

## 📱 Mobile-First Design
This CRM is designed to work great on mobile devices:
- Responsive design that works on phones, tablets, and desktops
- Bottom navigation for easy thumb access on mobile
- Optimized touch targets for mobile use
- Offline capabilities for field use

## 🛠️ Tech Stack
- **Frontend**: React + Next.js App Router (TypeScript)
- **UI**: Acernity UI components & Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **File Storage**: Vercel Blob for file/image uploads
- **Authentication**: JWT with HTTP-only cookies

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

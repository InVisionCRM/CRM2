# Dev Log - Roofing Mobile CRM

## What's this?
Just some random notes and thoughts during development. Nothing fancy, just keeping track of stuff.

## Tech Stack
- **Frontend**: React + Next.js App Router (TypeScript)
- **UI**: Acernity UI components & Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **File Storage**: Vercel Blob for file/image uploads

## 2023-05-15: Initial Project Setup
- Set up Next.js project with App Router
- Configured TypeScript
- Added Acernity UI and Tailwind CSS
- Set up Prisma with Neon PostgreSQL
- Created initial database schema

## 2023-05-20: Lead Management Implementation
- Created lead model in Prisma schema
- Implemented lead creation and listing functionality
- Added lead detail page
- Set up API routes for lead CRUD operations

## 2023-05-25: Vision Markers Implementation
- Added vision markers functionality for map-based lead tracking
- Created API routes for vision markers
- Implemented map component with marker support
- Added visit history tracking

## 2023-05-30: Database Schema Improvements
- Fixed data type mismatch between `sales_person_id` (text) and `users.id` (UUID)
- Added `user_id` column to `vision_markers` table to properly reference the `users` table
- Updated API routes to handle both legacy `sales_person_id` and new `user_id` fields
- Created `lib/db-markers.ts` utility for standardized marker operations
- Tested implementation with sample data

### Implementation Notes for Vision Markers User ID Fix

We identified a data type mismatch between the `sales_person_id` column in the `vision_markers` table (text) and the `id` column in the `users` table (UUID). This was causing foreign key constraint failures when saving markers.

To fix this issue, we:

1. Added a new `user_id` column of type UUID to the `vision_markers` table
2. Updated the API routes to store both the legacy `sales_person_id` (email string) and the new `user_id` (UUID)
3. Created a utility file `lib/db-markers.ts` to standardize marker operations and handle both fields
4. Updated the `crm-lead-card-modal.tsx` component to use the user ID from the session when available

This approach maintains backward compatibility while enabling proper foreign key relationships. The legacy `sales_person_id` field is kept for backward compatibility, but new code should use the `user_id` field for proper database relationships.

## Day 1: Initial Setup
Started with the basic structure. Set up Next.js with App Router and TypeScript. Added Tailwind CSS and Acernity UI components.

Thoughts:
- Mobile-first approach is working well
- TypeScript is a bit verbose but will save us headaches later
- App Router is nice but has some quirks

## Day 2: Dashboard & Navigation
Built the dashboard layout and navigation components. Added the mobile navigation bar.

Challenges:
- Making everything responsive is a pain
- Had to refactor the navigation a few times to get it right

## Day 3: Leads Management
Built the leads list, expandable lead cards, and lead detail pages. Added status grid for filtering leads.

Notes:
- Need to optimize the expandable cards for better performance
- Status grid works well on mobile

## Day 4: Appointments & Calendar
Added the appointments calendar with day, week, and month views. Built the appointment form and drawer.

Thoughts:
- Calendar views are tricky to get right
- Need to add weather integration for appointments

## Day 5: File Management
Added file upload functionality with Vercel Blob. Built the file upload grid and cards.

Notes:
- Blob storage is working great
- Need to add file type validation

## Day 6: Weather Integration
Added weather widget and appointment weather integration. Built location search component.

Challenges:
- API rate limiting is annoying
- Had to cache weather data to avoid hitting limits

## Day 7: Messages & Notifications
Added messaging system with message panel, list, and composer. Built notification system.

Notes:
- Real-time messaging will be added later
- Notifications need more work

## Day 8: Financial Reports
Added financial health page with various financial cards and charts.

Thoughts:
- Charts look good on mobile
- Need to add more filtering options

## Day 9: Team Performance
Added team performance page with leaderboard and performance metrics.

Notes:
- Leaderboard is working well
- Need to add more detailed metrics

## Day 10: Quick Links & Utilities
Added quick links page and various utility components like calculator.

Thoughts:
- Quick links are super useful
- Calculator needs more features

## Component Structure
Here's a rough breakdown of our component structure:

### Core Components
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Main dashboard page
- `components/dashboard-header.tsx` - Top navigation
- `components/dashboard-content.tsx` - Main content area
- `components/mobile-navigation.tsx` - Bottom mobile nav

### Leads Components
- `components/leads-list.tsx` - List of leads
- `components/leads-drawer.tsx` - Drawer for lead details
- `components/leads/expandable-lead-card.tsx` - Expandable lead card
- `components/leads/lead-contact-info.tsx` - Lead contact info
- `components/leads/lead-notes.tsx` - Lead notes
- `components/leads/lead-appointments.tsx` - Lead appointments
- `components/leads/lead-files.tsx` - Lead files
- `components/leads/lead-property-details.tsx` - Property details
- `components/leads/lead-proposal.tsx` - Proposal details
- `components/leads/lead-actions.tsx` - Lead actions
- `components/leads/lead-status-history.tsx` - Status history
- `components/leads/insurance-drawer.tsx` - Insurance info drawer
- `components/leads/insurance-info-card.tsx` - Insurance info card
- `components/leads/adjuster-appointment-scheduler.tsx` - Appointment scheduler
- `components/leads/appointment-countdown.tsx` - Countdown timer
- `components/leads/file-upload-grid.tsx` - File upload grid
- `components/leads/file-upload-card.tsx` - File upload card

### Appointments Components
- `components/appointments/calendar-view.tsx` - Calendar view
- `components/appointments/day-view.tsx` - Day view
- `components/appointments/week-view.tsx` - Week view
- `components/appointments/month-view.tsx` - Month view
- `components/appointments/appointment-form.tsx` - Appointment form
- `components/appointments/appointments-drawer.tsx` - Appointments drawer
- `components/appointments/date-context-menu.tsx` - Date context menu
- `components/appointments/appointment-dot.tsx` - Appointment dot
- `components/appointments/appointment-legend.tsx` - Appointment legend
- `components/appointments/appointment-weather.tsx` - Weather for appointment

### Dashboard Components
- `components/dashboard/summary-cards.tsx` - Summary cards
- `components/dashboard/quick-actions.tsx` - Quick actions
- `components/dashboard/today-appointments.tsx` - Today's appointments
- `components/dashboard/recent-activity.tsx` - Recent activity

### Weather Components
- `components/weather/weather-widget.tsx` - Weather widget
- `components/weather/weather-conditions.tsx` - Weather conditions
- `components/weather/weather-alert.tsx` - Weather alerts
- `components/weather/location-search.tsx` - Location search
- `components/weather/hourly-forecast.tsx` - Hourly forecast
- `components/weather/forecast-card.tsx` - Forecast card

### Financial Components
- `components/financial/summary-metrics-card.tsx` - Summary metrics
- `components/financial/cash-flow-card.tsx` - Cash flow
- `components/financial/aging-receivables-card.tsx` - Aging receivables
- `components/financial/payment-velocity-card.tsx` - Payment velocity
- `components/financial/period-comparison-card.tsx` - Period comparison
- `components/financial/projected-vs-actual-card.tsx` - Projected vs actual

### Team Components
- `components/team/performance-summary-card.tsx` - Performance summary
- `components/team/sales-leaderboard.tsx` - Sales leaderboard
- `components/team/performance-metrics-card.tsx` - Performance metrics

### Message Components
- `components/messages/message-widget.tsx` - Message widget
- `components/messages/message-panel.tsx` - Message panel
- `components/messages/message-list.tsx` - Message list
- `components/messages/message-item.tsx` - Message item
- `components/messages/message-composer.tsx` - Message composer
- `components/messages/message-fab.tsx` - Message FAB

### Quick Links Components
- `components/quick-links/link-category-card.tsx` - Link category card
- `components/quick-links/link-card.tsx` - Link card

### Utility Components
- `components/calculator/simple-calculator.tsx` - Simple calculator
- `components/custom-date-picker.tsx` - Custom date picker
- `components/status-grid.tsx` - Status grid
- `components/files/files-sheet.tsx` - Files sheet

## Random Thoughts
- We should probably add more tests
- Need to optimize performance for large datasets
- Mobile navigation could use some tweaks
- Should add more filtering options for leads
- Need to add more documentation

# Changelog

## [Unreleased]

### Added
- Added route visualization overlay component and GET endpoint for retrieving GPS trails.
- Added GPS-based route tracking for "door knock" sessions (RoutePoint model, API, lib, and UI component).
- Fixed lead creation functionality with proper database integration
- Updated lead detail page to fetch from database instead of mock data
- Improved error handling in database operations
- Added proper client ID sequence handling
- Added missing exports for insurance and adjuster appointment actions
- Added `user_id` column to `vision_markers` table to properly reference the `users` table
- Updated API routes to handle both legacy `sales_person_id` and new `user_id` fields
- Added `lib/db-markers.ts` utility for standardized marker operations

### Changed
- Modified lead list to work with database leads
- Updated API routes to handle database operations properly
- Fixed import paths for database functions
- Improved vision marker handling to use UUID for user identification
- Updated marker-related components to use the new user_id field

### Fixed
- Fixed "Lead not found" error when clicking on leads in the Active Leads page
- Fixed client ID sequence initialization
- Fixed missing exports in lead-actions.ts
- Fixed import errors in components
- Fixed data type mismatch between `sales_person_id` (text) and `users.id` (UUID)
- Fixed foreign key constraint failures when saving vision markers
- Improved error messages for debugging

## [0.1.0] - 2023-04-15

### Added
- Initial project setup
- Basic lead management functionality
- Mobile-first UI components

# PWA Deployment Guide

## Database Migration Issues

The PWA deployment was failing due to database timeout issues during the build process. This has been resolved by:

1. **Separating migrations from build**: The build process no longer runs `prisma migrate deploy`
2. **Adding connection pooling**: Better timeout handling for Neon database
3. **Creating safe migration script**: Separate script for database migrations

## Deployment Steps

### 1. Pre-deployment (Run locally or in CI)
```bash
# Run database migrations separately
npm run prisma:migrate:safe
```

### 2. Deploy to Vercel
The build process will now only:
- Generate Prisma client
- Build the Next.js application
- Generate PWA assets

### 3. Environment Variables
Ensure these are set in Vercel:
- `DATABASE_URL`: Your Neon database connection string
- `DIRECT_URL`: Direct connection to Neon database (for migrations)

## PWA Configuration

The PWA is now configured with:
- ✅ Service worker generation
- ✅ Manifest file
- ✅ Proper viewport settings
- ✅ Mobile keyboard support
- ✅ Offline functionality

## Troubleshooting

### Database Timeout
If you encounter database timeouts:
1. Run migrations manually: `npm run prisma:migrate:safe`
2. Check Neon database connection limits
3. Verify environment variables are correct

### PWA Issues
If PWA features aren't working:
1. Clear browser cache
2. Uninstall and reinstall the PWA
3. Check service worker registration in browser dev tools

## Build Commands

- `npm run build`: Standard build (no migrations)
- `npm run build:with-migrate`: Build with migrations (use carefully)
- `npm run prisma:migrate:safe`: Safe database migration 
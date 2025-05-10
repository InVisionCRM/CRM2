export const GOOGLE_CALENDAR_CONFIG = {
  // Google Calendar API configuration
  API_SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  
  // Calendar colors mapping to our appointment purposes
  COLOR_MAP: {
    INSPECTION: '1',  // Blue
    FILE_CLAIM: '2',  // Green
    FOLLOW_UP: '3',   // Purple
    ADJUSTER: '4',    // Red
    BUILD_DAY: '5',   // Yellow
    OTHER: '7',       // Gray
  },

  // Default calendar settings
  DEFAULTS: {
    CALENDAR_ID: 'primary',
    EVENT_DURATION: 60, // minutes
    TIME_ZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },

  // Error messages
  ERRORS: {
    FETCH_EVENTS: 'Failed to fetch calendar events',
    CREATE_EVENT: 'Failed to create calendar event',
    UPDATE_EVENT: 'Failed to update calendar event',
    DELETE_EVENT: 'Failed to delete calendar event',
    AUTH_ERROR: 'Authentication error',
  },
} as const; 
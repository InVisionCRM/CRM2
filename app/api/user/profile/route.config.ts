export const config = {
  api: {
    // Increase the maximum size limit for the requests (10MB)
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Disable response caching to ensure updated data is always fetched
    responseLimit: false,
  },
} 
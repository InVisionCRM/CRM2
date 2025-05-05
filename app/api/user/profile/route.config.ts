export const config = {
  runtime: 'edge',
  api: {
    // Increase the maximum size limit for the requests (10MB)
    bodyParser: false, // This is important for processing FormData
    // Disable response caching to ensure updated data is always fetched
    responseLimit: false,
  },
} 
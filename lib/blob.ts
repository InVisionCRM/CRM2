import { Storage } from "@google-cloud/storage";
import { nanoid } from "nanoid";

// Initialize GCS client
// Assumes GOOGLE_APPLICATION_CREDENTIALS is set in the environment,
// or GCS_PROJECT_ID, GCS_CLIENT_EMAIL, and GCS_PRIVATE_KEY are set.
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
  throw new Error(
    "GCS_BUCKET_NAME environment variable is not set. Please configure it in your Vercel environment.",
  );
}

const bucket = storage.bucket(bucketName);

export async function uploadToBlob(file: File, leadId?: string) {
  try {
    // Create a filename with optional folder structure
    let gcsFilename;
    const uniqueId = nanoid();
    if (leadId) {
      // If leadId is provided, use client folder structure with the client ID
      gcsFilename = `clients/${leadId}/${uniqueId}-${file.name}`;
    } else {
      // Otherwise use the default structure
      gcsFilename = `${uniqueId}-${file.name}`;
    }

    // Vercel Blob SDK by default uploaded files as ArrayBuffer
    // GCS SDK can take a Buffer or a path to a file.
    // We need to convert the File object to a Buffer.
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const gcsFile = bucket.file(gcsFilename);

    await gcsFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
      // To make the file publicly readable:
      // Option 1: Make the object public explicitly
      public: true,
      // Option 2: Ensure your bucket has uniform bucket-level access disabled
      // and default object ACLs allow public reads, or set a predefinedAcl.
      // predefinedAcl: 'publicRead',
    });

    // Construct the public URL.
    // This format is standard for public GCS objects.
    // Ensure your bucket/objects are configured for public access.
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFilename}`;

    return {
      url: publicUrl,
      filename: file.name, // Original filename
      filesize: file.size,
      gcsPath: gcsFilename, // Store GCS path if needed for direct access/deletion
    };
  } catch (error) {
    console.error("Error uploading file to GCS:", error);
    throw new Error("Failed to upload file to GCS");
  }
}

export async function deleteFromBlob(url: string): Promise<void> {
  try {
    if (!bucketName) {
      // This check is technically redundant due to the top-level check,
      // but good for belt-and-suspenders.
      console.error("GCS_BUCKET_NAME is not set, cannot delete file.");
      throw new Error("GCS_BUCKET_NAME not configured.");
    }

    // Extract the GCS object path from the URL.
    // Example URL: https://storage.googleapis.com/your-bucket-name/path/to/your/file.jpg
    const prefix = `https://storage.googleapis.com/${bucketName}/`;
    if (!url.startsWith(prefix)) {
      console.error(
        `URL "${url}" does not match expected GCS format for bucket "${bucketName}". Cannot delete.`,
      );
      // Potentially, this could be an old Vercel Blob URL.
      // Decide if you want to attempt deletion from Vercel Blob as a fallback,
      // or just error out. For now, we'll error out for GCS-specific logic.
      throw new Error("Invalid GCS URL format for deletion.");
    }
    const gcsFilename = url.substring(prefix.length);

    if (!gcsFilename) {
      console.error(`Could not extract GCS filename from URL: ${url}`);
      throw new Error("Failed to extract GCS filename from URL.");
    }

    const gcsFile = bucket.file(gcsFilename);
    await gcsFile.delete();
    console.log(`Successfully deleted ${gcsFilename} from GCS bucket ${bucketName}.`);
  } catch (error) {
    console.error("Error deleting from GCS:", error);
    // It's important to check if the error is because the file doesn't exist,
    // which might not be a critical failure in some application flows.
    // GCS error for "Not Found" is typically code 404.
    // if (error.code === 404) {
    //   console.warn(`File not found in GCS during deletion attempt: ${url}`);
    //   // Optionally, don't throw an error if file not found is acceptable.
    //   return;
    // }
    throw new Error("Failed to delete file from GCS.");
  }
}

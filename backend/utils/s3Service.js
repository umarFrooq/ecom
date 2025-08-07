let  { S3Client, PutObjectCommand, DeleteObjectCommand } =require ("@aws-sdk/client-s3");
let { v4 , uuidv4 } = require('uuid'); // Attempt to import, will adjust if not found

// Configure AWS S3 Client
// Ensure these environment variables are set:
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Uploads a file to AWS S3.
 * @param {Object} file - The file object (typically from multer, containing buffer and originalname).
 * @param {string} [folderName='products'] - Optional folder name to store the file in S3.
 * @returns {Promise<string>} - The S3 URL of the uploaded file.
 * @throws {Error} - If upload fails.
 */
 const uploadFileToS3 = async (file, folderName = 'products') => {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }
  if (!file || !file.buffer || !file.originalname) {
    throw new Error("Invalid file object provided for S3 upload.");
  }

  let uniqueFilenameBase;
  try {
    uniqueFilenameBase = uuidv4();
  } catch (e) {
    // Fallback if uuid is not available
    console.warn("uuid not available, using Date.now() for filename uniqueness. Consider installing uuid package.");
    uniqueFilenameBase = Date.now();
  }

  const fileExtension = file.originalname.split('.').pop();
  // Ensure folderName ends with a slash if it's not empty, otherwise, don't add a leading slash if folderName is empty.
  const keyPrefix = folderName ? (folderName.endsWith('/') ? folderName : `${folderName}/`) : '';
  const uniqueKey = `${keyPrefix}${uniqueFilenameBase}-${file.originalname.replace(/ /g, '_')}`; // Basic sanitization

  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: uniqueKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Optional: if you want files to be publicly readable by default
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    // Construct the URL. Note: URL format can vary based on region and bucket settings.
    // This is a common format for virtual-hosted style access.
    // Ensure your bucket has public access configured if you use this URL format directly,
    // or use S3 GetObject to generate presigned URLs for private content.
    // For product images, public-read is common.
    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Deletes a file from AWS S3.
 * @param {string} fileUrl - The S3 URL of the file to delete.
 * @returns {Promise<void>}
 * @throws {Error} - If deletion fails or URL is invalid.
 */
 const deleteFileFromS3 = async (fileUrl) => {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }
  if (!fileUrl) {
    throw new Error("Invalid file URL provided for S3 deletion.");
  }

  let fileKey;
  try {
    const url = new URL(fileUrl);
    // Example S3 URL: https://your-bucket-name.s3.your-region.amazonaws.com/path/to/your/file.jpg
    // The key is the path part after the host.
    // This parsing might need adjustment based on the exact URL format.
    if (url.hostname === `${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`) {
      fileKey = url.pathname.substring(1); // Remove leading slash
    } else {
      // Attempt to extract key if it's just bucket_name/key format in URL (less common for direct S3 URLs)
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 1 && pathParts[0] === S3_BUCKET_NAME) {
          fileKey = pathParts.slice(1).join('/');
      } else if (pathParts.length > 0 && !pathParts[0].includes('.amazonaws.com')) {
          // if URL is like /products/image.jpg (relative to bucket)
          fileKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      } else {
         throw new Error("Cannot determine S3 file key from URL pattern.");
      }
    }
     if (!fileKey) {
        throw new Error("Could not extract file key from S3 URL.");
    }

  } catch (e) {
    console.error("Error parsing S3 URL:", e);
    // Fallback: If URL is just the key (e.g., "products/image.jpg") passed directly
    // This is less robust. Prefer full URLs and proper parsing.
    if (!fileUrl.includes('https://')) {
        console.warn("Assuming fileUrl is actually a fileKey as URL parsing failed.");
        fileKey = fileUrl;
    } else {
        throw new Error(`Invalid S3 URL format: ${fileUrl}. Error: ${e.message}`);
    }
  }


  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error(`Error deleting file ${fileKey} from S3:`, error);
    // It's often okay to not throw an error if the file is already gone (e.g. if retrying a delete)
    // But for now, we'll be strict.
    if (error.name === 'NoSuchKey') {
        console.warn(`File ${fileKey} not found in S3. Assuming already deleted.`);
        return; // Or handle as success
    }
    throw new Error(`Failed to delete file ${fileKey} from S3: ${error.message}`);
  }
};

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};

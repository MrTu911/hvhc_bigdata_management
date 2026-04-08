
// AWS S3 Configuration for Cloud Storage
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Get S3 bucket configuration from environment variables
 */
export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME || "",
    folderPrefix: process.env.AWS_FOLDER_PREFIX || "",
  };
}

/**
 * Create and configure S3 client
 * Uses AWS credentials from environment or IAM role
 */
export function createS3Client(): S3Client {
  return new S3Client({
    // AWS SDK will automatically use environment variables:
    // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
    // or IAM role if running on AWS infrastructure
  });
}

/**
 * Validate that required AWS configuration is present
 */
export function validateAwsConfig(): boolean {
  const { bucketName } = getBucketConfig();
  
  if (!bucketName) {
    console.warn("AWS_BUCKET_NAME not configured");
    return false;
  }
  
  return true;
}

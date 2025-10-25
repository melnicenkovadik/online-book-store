import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { getEnv } from "./env";

// Initialize Cloudinary with environment variables
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  getEnv();

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Optimize image URL for different sizes and formats
 * @param url Original Cloudinary URL
 * @param width Desired width
 * @param height Desired height
 * @param options Additional options
 * @returns Optimized image URL
 */
export function optimizeImage(
  url: string,
  width: number,
  height: number,
  options: {
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
    quality?: number;
    crop?: "fill" | "fit" | "limit" | "pad" | "scale" | "thumb";
    gravity?: "auto" | "face" | "center";
    blur?: number;
  } = {},
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  const {
    format = "auto",
    quality = 80,
    crop = "fill",
    gravity = "auto",
    blur,
  } = options;

  // Parse Cloudinary URL to extract components
  const regex =
    /https?:\/\/res.cloudinary.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)/;
  const match = url.match(regex);

  if (!match) {
    return url;
  }

  const [, cloudName, imagePath] = match;

  // Build transformation string
  let transformation = `c_${crop},w_${width},h_${height},q_${quality},g_${gravity},f_${format}`;

  if (blur && blur > 0) {
    transformation += `,e_blur:${blur}`;
  }

  // Return optimized URL
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${imagePath}`;
}

/**
 * Generate a low-quality placeholder image
 * @param url Original Cloudinary URL
 * @returns Low-quality placeholder URL
 */
export function generatePlaceholder(url: string): string {
  return optimizeImage(url, 20, 20, {
    quality: 30,
    blur: 1000,
  });
}

/**
 * Upload image to Cloudinary
 * @param file File to upload
 * @param options Upload options
 * @returns Upload result
 */
export async function uploadImage(
  file: File | Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: string[];
    tags?: string[];
  } = {},
): Promise<CloudinaryUploadResult> {
  const { folder = "products", publicId, transformation, tags } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      ...(publicId ? { public_id: publicId } : {}),
      ...(transformation ? { transformation } : {}),
      ...(tags ? { tags } : {}),
    };

    const uploadCallback = (
      error: Error | undefined,
      result: CloudinaryUploadResult | undefined,
    ) => {
      if (error) {
        reject(error);
      } else if (result) {
        resolve(result);
      } else {
        reject(new Error("Upload failed without error or result"));
      }
    };

    if (file instanceof File) {
      // Convert File to base64 for upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        cloudinary.uploader.upload(base64, uploadOptions, uploadCallback);
      };
      reader.readAsDataURL(file);
    } else {
      // Upload buffer directly
      cloudinary.uploader
        .upload_stream(uploadOptions, uploadCallback)
        .end(file);
    }
  });
}

import type { UploadApiResponse } from "cloudinary";

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export interface ImageUploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: "image" | "video" | "raw" | "auto";
  format?: string;
  quality?: string;
  fetch_format?: string;
  transformation?: Array<Record<string, unknown>>;
}

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: "fit" | "fill" | "limit" | "scale" | "pad";
  quality?: string;
  format?: string;
}

export interface OptimizedImageUrlOptions {
  transformation?: ImageTransformationOptions[];
  secure?: boolean;
}

export interface CloudinaryUploadResult extends UploadApiResponse {}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

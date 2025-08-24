import { v2 as cloudinary } from "cloudinary";
import type {
  CloudinaryUploadResult,
  ImageTransformationOptions,
} from "@/types/cloudinary";
import { getEnv } from "./env";

// Конфігурація Cloudinary
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  getEnv();
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Завантажує зображення в Cloudinary
 * @param buffer - Buffer з файлом
 * @param filename - Оригінальне ім'я файлу
 * @returns Promise з результатом завантаження
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "books-store/products", // Папка в Cloudinary
          public_id: `${Date.now()}-${filename.split(".")[0]}`, // Унікальний ID
          resource_type: "image",
          format: "webp", // Автоконвертація в WebP
          quality: "auto:good", // Автооптимізація якості
          fetch_format: "auto", // Автовибір формату
          transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // Максимальний розмір
            { quality: "auto:good" },
            { format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else if (result) {
            console.log("✅ Cloudinary upload success:", result.secure_url);
            resolve(result);
          } else {
            reject(new Error("Unknown error occurred"));
          }
        },
      )
      .end(buffer);
  });
}

/**
 * Видаляє зображення з Cloudinary
 * @param publicId - Public ID зображення
 */
export async function deleteImageFromCloudinary(
  publicId: string,
): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ Image deleted from Cloudinary:", result);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
}

/**
 * Генерує оптимізований URL для зображення
 * @param publicId - Public ID зображення
 * @param width - Ширина (опціонально)
 * @param height - Висота (опціонально)
 */
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number,
): string {
  const transformation: ImageTransformationOptions[] = [];

  if (width !== undefined || height !== undefined) {
    const transformationOptions: ImageTransformationOptions = {
      crop: "fit",
      quality: "auto:good",
      format: "auto",
    };

    if (width !== undefined) {
      transformationOptions.width = width;
    }

    if (height !== undefined) {
      transformationOptions.height = height;
    }

    transformation.push(transformationOptions);
  }

  return cloudinary.url(publicId, {
    transformation,
    secure: true,
  });
}

export default cloudinary;

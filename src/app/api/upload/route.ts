import type { NextRequest } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Cloudinary Upload API called");

    // Перевіряємо наявність credentials
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("❌ Cloudinary credentials not found");
      return Response.json(
        { error: "Cloudinary не налаштований. Додай credentials в .env.local" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    console.log("📁 Files received:", files.length);
    files.forEach((file, i) => {
      console.log(`File ${i}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      });
    });

    if (!files || files.length === 0) {
      console.log("❌ No files received");
      return Response.json({ error: "Файли не отримані" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const uploadPromises: Promise<void>[] = [];

    for (const file of files) {
      console.log(`🖼️ Processing file: ${file.name}, type: ${file.type}`);

      // Перевіряємо тип файлу
      if (!file.type.startsWith("image/")) {
        console.log(`❌ Skipping non-image file: ${file.type}`);
        continue;
      }

      // Додаємо в масив промісів для паралельного завантаження
      const uploadPromise = (async () => {
        try {
          console.log(`☁️ Uploading to Cloudinary: ${file.name}`);

          // Конвертуємо файл в Buffer
          const buffer = Buffer.from(await file.arrayBuffer());

          // Завантажуємо в Cloudinary
          const result = await uploadImageToCloudinary(buffer, file.name);

          // Додаємо URL в результат
          uploadedUrls.push(result.secure_url);
          console.log(`✅ Cloudinary upload success: ${result.secure_url}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          throw error;
        }
      })();

      uploadPromises.push(uploadPromise);
    }

    // Очікуємо завантаження всіх файлів
    await Promise.all(uploadPromises);

    console.log(`🎉 All uploads completed. Total: ${uploadedUrls.length}`);

    return Response.json({
      urls: uploadedUrls,
      message: `Успішно завантажено ${uploadedUrls.length} зображень в Cloudinary`,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return Response.json(
      { error: "Помилка завантаження в Cloudinary" },
      { status: 500 },
    );
  }
}

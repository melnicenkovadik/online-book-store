import { z } from "zod";

// Check if we're in a Vercel environment during build
const isVercelBuild =
  process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

// Define schema for environment variables
export const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD cannot be empty"),
  SEED_TOKEN: z.string().min(1, "SEED_TOKEN cannot be empty"),

  // Auth
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET should be at least 32 characters for security"),

  // Client
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME cannot be empty"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY cannot be empty"),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET cannot be empty"),
});

// Parse and export environment variables
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns a typed object
 * @throws {Error} If environment variables are invalid
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.format();
      const errorMessages: string[] = [];

      // Рекурсивно обходимо об'єкт помилок
      function processErrors(
        obj: z.ZodFormattedError<any>,
        path: string[] = [],
      ): void {
        if (obj._errors && obj._errors.length > 0) {
          errorMessages.push(`${path.join(".")}: ${obj._errors.join(", ")}`);
        }

        // Обробляємо вкладені помилки
        Object.keys(obj).forEach((key) => {
          if (key !== "_errors" && typeof obj[key] === "object") {
            processErrors(obj[key] as z.ZodFormattedError<any>, [...path, key]);
          }
        });
      }

      processErrors(formattedErrors);

      console.error("❌ Environment validation failed:");
      console.error(errorMessages.join("\n"));

      // Don't exit with error if we're in Vercel build environment
      if (isVercelBuild) {
        console.warn(
          "⚠️ Running in Vercel build environment - continuing despite validation errors",
        );
        // Return a mock environment to allow build to continue
        return process.env as unknown as Env;
      } else {
        process.exit(1);
      }
    }

    throw error;
  }
}

// Singleton instance of validated environment
let env: Env;

/**
 * Get validated environment variables
 * This function ensures validation happens only once
 */
export function getEnv(): Env {
  if (!env) {
    env = validateEnv();
  }
  return env;
}

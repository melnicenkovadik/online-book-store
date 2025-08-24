import { z } from 'zod';

// Define schema for environment variables
export const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD cannot be empty'),
  SEED_TOKEN: z.string().min(1, 'SEED_TOKEN cannot be empty'),
  
  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters for security'),
  
  // Client
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME cannot be empty'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY cannot be empty'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET cannot be empty'),
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
      const formattedErrors = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join('\n');
      
      console.error('❌ Environment validation failed:');
      console.error(formattedErrors);
      process.exit(1);
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

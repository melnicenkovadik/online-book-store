import mongoose, { type Connection } from "mongoose";
import { getEnv } from "./env";

// Global cache to prevent creating multiple connections in dev/SSR
const globalWithMongoose = global as unknown as {
  _mongooseConn?: Connection | null;
  _mongoosePromise?: Promise<typeof mongoose> | null;
};

export async function connectToDB() {
  if (globalWithMongoose._mongooseConn) {
    console.log("[DB] Using existing connection");
    return globalWithMongoose._mongooseConn;
  }

  if (!globalWithMongoose._mongoosePromise) {
    try {
      const { MONGODB_URI } = getEnv();
      console.log("[DB] Connecting to MongoDB...");

      // Recommended mongoose options (Mongoose 8 has sensible defaults)
      globalWithMongoose._mongoosePromise = mongoose
        .connect(MONGODB_URI)
        .then((m) => {
          console.log("[DB] Connected successfully");
          return m;
        })
        .catch((err) => {
          console.error("[DB] Connection failed:", err);
          globalWithMongoose._mongoosePromise = null;
          throw err;
        });
    } catch (err) {
      console.error("[DB] Error initializing connection:", err);
      throw err;
    }
  }

  const mongooseInstance = await globalWithMongoose._mongoosePromise;
  globalWithMongoose._mongooseConn = mongooseInstance.connection;
  return globalWithMongoose._mongooseConn;
}

export function dbState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection?.readyState ?? 0;
}

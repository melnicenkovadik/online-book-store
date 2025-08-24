import mongoose, { type Connection } from "mongoose";

// Global cache to prevent creating multiple connections in dev/SSR
const globalWithMongoose = global as unknown as {
  _mongooseConn?: Connection | null;
  _mongoosePromise?: Promise<typeof mongoose> | null;
};

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;

if (!MONGODB_URI) {
  // Do not throw at import time in Next; throw on connect to not break build tools
  // This helps with "next build" where envs may not be injected yet.
}

export async function connectToDB() {
  if (globalWithMongoose._mongooseConn) {
    return globalWithMongoose._mongooseConn;
  }

  if (!globalWithMongoose._mongoosePromise) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }

    // Recommended mongoose options (Mongoose 8 has sensible defaults)
    globalWithMongoose._mongoosePromise = mongoose
      .connect(MONGODB_URI)
      .then((m) => m);
  }

  const mongooseInstance = await globalWithMongoose._mongoosePromise;
  globalWithMongoose._mongooseConn = mongooseInstance.connection;
  return globalWithMongoose._mongooseConn;
}

export function dbState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection?.readyState ?? 0;
}

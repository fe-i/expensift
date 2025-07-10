import { env } from "@/env";
import { MongoClient } from "mongodb";
import _mongoose, { connect } from "mongoose";

// MongoDB client for Better Auth and native queries
const client = new MongoClient(env.MONGODB_URI);
const db = client.db();

// Mongoose for application data (models, schemas, CRUD, etc.)
declare global {
  var mongoose: {
    promise: ReturnType<typeof connect> | null;
    conn: typeof _mongoose | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    console.log("🚀 Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = connect(env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ New MongoDB connection established");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ Connection to MongoDB failed:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { db, connectDb };

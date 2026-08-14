// import dotenv from "dotenv";
// dotenv.config();

// import app from "./app.js";
// import connectDB from "./config/db.js";

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();

//   const server = app.listen(PORT, () => {
//     console.log(`Exam Platform API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
//   });

//   // Graceful shutdown
//   const shutdown = (signal) => {
//     console.log(`\n${signal} received. Shutting down gracefully...`);
//     server.close(() => {
//       console.log("HTTP server closed.");
//       process.exit(0);
//     });
//   };

//   process.on("SIGINT", () => shutdown("SIGINT"));
//   process.on("SIGTERM", () => shutdown("SIGTERM"));

//   process.on("unhandledRejection", (err) => {
//     console.error("Unhandled Rejection:", err);
//     server.close(() => process.exit(1));
//   });
// };

// startServer();

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { getRedisClient, closeRedisClient } from "./config/redis.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Touches the client so a connection attempt (and the log line saying
  // whether caching is active) happens once at boot rather than on the
  // first request. Entirely optional - the app runs fine either way.
  getRedisClient();

  const server = app.listen(PORT, () => {
    console.log(
      `Exam Platform API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`
    );
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeRedisClient();
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    server.close(() => process.exit(1));
  });
};

startServer();
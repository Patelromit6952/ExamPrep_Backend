// import express from "express";
// import helmet from "helmet";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import morgan from "morgan";

// import apiRoutes from "./routes/index.js";
// import { notFound, errorHandler } from "./middleware/error.middleware.js";
// import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
// import { sanitizeBody } from "./middleware/sanitize.middleware.js";

// const app = express();

// // Security headers
// app.use(helmet());

// // CORS - only allow the configured frontend origin, with credentials for cookies
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );

// // Body & cookie parsing
// app.use(express.json({ limit: "1mb" }));
// app.use(express.urlencoded({ extended: true, limit: "1mb" }));
// app.use(cookieParser());

// // Strip NoSQL-injection-prone keys from incoming payloads
// app.use(sanitizeBody);

// // Request logging (skip in test env)
// if (process.env.NODE_ENV !== "test") {
//   app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// }

// // Rate limiting on all /api routes
// app.use("/api", apiLimiter);

// app.use("/api", apiRoutes);

// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Exam Platform API is running",
//     data: null,
//   });
// });

// app.use(notFound);
// app.use(errorHandler);

// export default app;

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import { sanitizeBody } from "./middleware/sanitize.middleware.js";

const app = express();

// Security headers
app.use(helmet());

// CORS - allow the configured web frontend origin, plus requests with no
// Origin header at all (the Electron desktop build loads from file:// and
// sends no Origin, same as curl/Postman/mobile webviews).
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigin =
        "https://examprep2026.netlify.app" ||
        "http://localhost:5173";
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// Body & cookie parsing. The `verify` hook stashes the raw request body so
// the Razorpay webhook handler can validate its HMAC signature against the
// exact bytes Razorpay sent (JSON.stringify(req.body) is not guaranteed to
// byte-for-byte match what was originally posted).
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Strip NoSQL-injection-prone keys from incoming payloads
app.use(sanitizeBody);

// Request logging (skip in test env)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Rate limiting on all /api routes
app.use("/api", apiLimiter);

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Exam Platform API is running",
    data: null
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
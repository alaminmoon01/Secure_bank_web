
import "dotenv/config";
import express from "express";
import cors from "cors";

import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import deviceRoutes from "./src/modules/device-monitoring/device.routes.js";
const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SecureBank API is running",
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "MySQL Database Connected Successfully!",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", transactionRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/device-monitoring", deviceRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

async function startServer() {
  try {
    console.log("Connecting to MySQL database...");

    await prisma.$connect();

    console.log("MySQL Database Connected Successfully!");

    app.listen(PORT, () => {
      console.log("--------------------------------");
      console.log("SECUREBANK API SERVER");
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Frontend: http://localhost:5175`);
      console.log("--------------------------------");
    });
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED:", error);

    process.exitCode = 1;

    await prisma.$disconnect().catch(() => {});
  }
}

startServer();

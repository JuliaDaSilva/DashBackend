import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";


dotenv.config();
connectDB();

const app = express();

// Resolve __dirname since ES modules don’t have it:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/curl
    if (origin.startsWith("http://localhost:517")) return cb(null, true); // 5173, 5174, etc.
    if (origin.startsWith("http://127.0.0.1:517")) return cb(null, true);

    const prod = process.env.FRONTEND_URL?.replace("/#", "");
    if (prod && origin === prod) return cb(null, true);

    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", passwordResetRoutes);


// FIX: serve uploads from backend/uploads folder
const isProd = process.env.NODE_ENV === "production";
const uploadsPath = isProd ? "/var/data/uploads" : path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadsPath));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("ElleHacks backend is running 🚀");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

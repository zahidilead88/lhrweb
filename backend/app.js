const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// Allow larger payloads (adjust as needed)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// app.use("/api/menu", require("./routes/menu"));
app.use("/public/uploads", express.static("public/uploads"));

const adminAuthRoutes = require("./routes/auth");
app.use("/api/auth", adminAuthRoutes);

const authRoutes = require("./routes/adminAuth");
app.use("/api/admin/auth", authRoutes);

const menuRoutes = require("./routes/menu");
app.use("/api/menu", menuRoutes);

const protectedRoutes = require("./routes/protected");
app.use("/api", protectedRoutes);

const blogRoutes = require("./routes/blogs");
app.use("/api/blogs", blogRoutes);

const projectRoutes = require("./routes/projects");
app.use("/api/projects", projectRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const pageRoutes = require("./routes/pages");
app.use("/api/pages", pageRoutes);

const sectionRoutes = require("./routes/sections");
app.use("/api/sections", sectionRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));

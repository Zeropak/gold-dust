const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const { attachUser, requireAuth, requireAdmin } = require("./middleware/auth");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "super-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(attachUser);

app.get("/", (req, res) => {
  res.render("index", {
    user: req.user
  });
});

app.use("/", authRoutes);

app.get("/profile", requireAuth, (req, res) => {
  res.render("profile", {
    user: req.user
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  res.render("admin", {
    user: req.user
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const express = require("express");
const path = require("path");
const session = require("express-session");
const dotenv = require("dotenv");
const pool = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const { attachUser, requireAuth, requireAdmin } = require("./middleware/auth");

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(30) DEFAULT 'user',
        rank VARCHAR(50) DEFAULT 'Новичок',
        chat_time_minutes INTEGER DEFAULT 0,
        is_banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized");
  } catch (err) {
    console.error("Database init error:", err.message);
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-me",
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
  res.render("index", { user: req.user });
});

app.use("/", authRoutes);

app.get("/profile", requireAuth, (req, res) => {
  res.render("profile", { user: req.user });
});

app.get("/admin", requireAdmin, (req, res) => {
  res.render("admin", { user: req.user });
});
app.get("/make-me-admin", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).send("Сначала войди в аккаунт.");
    }

    await pool.query(
      "UPDATE users SET role = 'admin' WHERE id = $1",
      [req.user.id]
    );

    res.send("Теперь ты admin. Обнови страницу профиля или зайди в /admin");
  } catch (err) {
    console.error("make admin error:", err.message);
    res.status(500).send("Ошибка выдачи admin.");
  }
});
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
});

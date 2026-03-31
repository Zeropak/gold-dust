const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.render("register", { error: "Заполни все поля." });
    }

    if (password.length < 6) {
      return res.render("register", { error: "Пароль должен быть минимум 6 символов." });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.render("register", { error: "Пользователь с таким логином или email уже существует." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [username, email.toLowerCase(), passwordHash]
    );

    req.session.userId = result.rows[0].id;

    return res.redirect("/profile");
  } catch (err) {
    console.error("Register error:", err.message);
    return res.render("register", { error: "Ошибка регистрации." });
  }
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { error: "Заполни все поля." });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.render("login", { error: "Неверный email или пароль." });
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return res.render("login", { error: "Ваш аккаунт заблокирован." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.render("login", { error: "Неверный email или пароль." });
    }

    req.session.userId = user.id;

    return res.redirect("/profile");
  } catch (err) {
    console.error("Login error:", err.message);
    return res.render("login", { error: "Ошибка входа." });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;

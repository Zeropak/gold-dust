const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

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

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.render("register", { error: "Пользователь с таким логином или email уже существует." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    const user = new User({
      username,
      email,
      passwordHash,
      ipHistory: [String(ip)]
    });

    await user.save();

    req.session.userId = user._id.toString();

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

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "Неверный email или пароль." });
    }

    if (user.isBanned) {
      return res.render("login", { error: "Ваш аккаунт заблокирован." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.render("login", { error: "Неверный email или пароль." });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ipString = String(ip);

    if (!user.ipHistory.includes(ipString)) {
      user.ipHistory.push(ipString);
      await user.save();
    }

    req.session.userId = user._id.toString();

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

const pool = require("../db");

async function attachUser(req, res, next) {
  res.locals.user = null;
  req.user = null;

  try {
    if (!req.session.userId) {
      return next();
    }

    const result = await pool.query(
      "SELECT id, username, email, role, rank, chat_time_minutes, is_banned, created_at FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      return next();
    }

    req.user = result.rows[0];
    res.locals.user = result.rows[0];
    next();
  } catch (err) {
    console.error("attachUser error:", err.message);
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }

  if (req.user.is_banned) {
    return res.status(403).send("Ваш аккаунт заблокирован.");
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }

  if (req.user.role !== "admin") {
    return res.status(403).send("Доступ только для администратора.");
  }

  next();
}

module.exports = {
  attachUser,
  requireAuth,
  requireAdmin
};

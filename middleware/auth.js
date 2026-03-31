const User = require("../models/User");

async function attachUser(req, res, next) {
  res.locals.user = null;
  req.user = null;

  try {
    if (!req.session.userId) {
      return next();
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      return next();
    }

    req.user = user;
    res.locals.user = user;
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

  if (req.user.isBanned) {
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

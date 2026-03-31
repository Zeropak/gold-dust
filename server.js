app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, rank, chat_time_minutes, is_banned, created_at
      FROM users
      ORDER BY id ASC
    `);

    res.render("admin-users", {
      user: req.user,
      users: result.rows
    });
  } catch (err) {
    console.error("admin users error:", err.message);
    res.status(500).send("Ошибка загрузки пользователей.");
  }
});

app.post("/admin/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const allowedRoles = ["user", "moderator", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).send("Недопустимая роль.");
    }

    await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2",
      [role, userId]
    );

    res.redirect("/admin/users");
  } catch (err) {
    console.error("change role error:", err.message);
    res.status(500).send("Ошибка смены роли.");
  }
});

app.post("/admin/users/:id/ban", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.query(
      "UPDATE users SET is_banned = true WHERE id = $1",
      [userId]
    );

    res.redirect("/admin/users");
  } catch (err) {
    console.error("ban user error:", err.message);
    res.status(500).send("Ошибка бана.");
  }
});

app.post("/admin/users/:id/unban", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.query(
      "UPDATE users SET is_banned = false WHERE id = $1",
      [userId]
    );

    res.redirect("/admin/users");
  } catch (err) {
    console.error("unban user error:", err.message);
    res.status(500).send("Ошибка разбана.");
  }
});

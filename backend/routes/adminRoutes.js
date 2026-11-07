
const router = require("express").Router();
const { User } = require("../models");
const authenticate = require("../middleware/auth");

// Only the designated administrator can access this route.
async function requireAdmin(req, res, next) {
  try {
    const adminId = Number(process.env.ADMIN_USER_ID);

    if (!adminId || req.user.id !== adminId) {
      return res.status(403).json({
        message: "Administrator access required."
      });
    }

    const admin = await User.findByPk(adminId);

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        message: "Administrator account unavailable."
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Could not verify administrator."
    });
  }
}

// Get dashboard statistics and recent members.
router.get("/members", authenticate, requireAdmin, async (req, res) => {
  try {
    const totalMembers = await User.count();

    const members = await User.findAll({
      attributes: [
        "id",
        "username",
        "country",
        "isActive",
        "createdAt"
      ],
      order: [["createdAt", "DESC"]],
      limit: 50
    });

    res.json({
      totalMembers,
      members
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    res.status(500).json({
      message: "Could not load members."
    });
  }
});

module.exports = router;

const router = require("express").Router();
const { Op } = require("sequelize");
const { User, Block, Friendship } = require("../models");
const auth = require("../middleware/auth");

router.get("/discover", auth, async (req, res) => {
  try {
    const where = { id: { [Op.ne]: req.user.id }, isActive: true };
    if (req.query.country) where.country = { [Op.like]: `%${String(req.query.country).slice(0, 60)}%` };
    if (req.query.interest) where.interests = { [Op.like]: `%${String(req.query.interest).slice(0, 60)}%` };

    const blocks = await Block.findAll({
      where: { [Op.or]: [{ blockerId: req.user.id }, { blockedId: req.user.id }] }
    });
    const blockedIds = blocks.map(b => b.blockerId === req.user.id ? b.blockedId : b.blockerId);
    if (blockedIds.length) where.id[Op.notIn] = blockedIds;

    const users = await User.findAll({
      where, attributes: ["id", "username", "country", "interests", "bio", "age"],
      limit: 40, order: [["createdAt", "DESC"]]
    });
    const relations = await Friendship.findAll({
      where: { [Op.or]: [{ requesterId: req.user.id }, { addresseeId: req.user.id }] }
    });
    const statusByUser = {};
    relations.forEach(r => {
      const other = r.requesterId === req.user.id ? r.addresseeId : r.requesterId;
      statusByUser[other] = r.status === "pending"
        ? (r.requesterId === req.user.id ? "request_sent" : "request_received")
        : r.status;
    });
    res.json({ users: users.map(u => ({ ...u.toJSON(), friendshipStatus: statusByUser[u.id] || "none" })) });
  } catch (error) {
    res.status(500).json({ message: "Could not load people." });
  }
});

router.get("/profile", auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ["id", "username", "country", "interests", "bio", "age", "email"] });
  res.json({ user });
});

router.put("/profile", auth, async (req, res) => {
  const { country, interests, bio } = req.body;
  if (String(bio || "").length > 240 || String(interests || "").length > 300) {
    return res.status(400).json({ message: "Bio or interests are too long." });
  }
  await User.update({ country, interests, bio }, { where: { id: req.user.id } });
  const user = await User.findByPk(req.user.id, { attributes: ["id", "username", "country", "interests", "bio", "age"] });
  res.json({ message: "Profile updated.", user });
});

module.exports = router;

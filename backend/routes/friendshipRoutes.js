const router = require("express").Router();
const { Op } = require("sequelize");
const { Friendship, User, Block } = require("../models");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const items = await Friendship.findAll({
    where: { [Op.or]: [{ requesterId: req.user.id }, { addresseeId: req.user.id }] },
    include: [
      { model: User, as: "requester", attributes: ["id", "username", "country"] },
      { model: User, as: "addressee", attributes: ["id", "username", "country"] }
    ],
    order: [["createdAt", "DESC"]]
  });
  res.json({ friendships: items });
});

router.post("/request/:userId", auth, async (req, res) => {
  const targetId = Number(req.params.userId);
  if (!Number.isInteger(targetId) || targetId === req.user.id) return res.status(400).json({ message: "Invalid friend." });
  const target = await User.findByPk(targetId);
  if (!target || !target.isActive) return res.status(404).json({ message: "User not found." });
  const blocked = await Block.findOne({ where: { [Op.or]: [
    { blockerId: req.user.id, blockedId: targetId }, { blockerId: targetId, blockedId: req.user.id }
  ] } });
  if (blocked) return res.status(403).json({ message: "This connection is unavailable." });
  const existing = await Friendship.findOne({ where: { [Op.or]: [
    { requesterId: req.user.id, addresseeId: targetId }, { requesterId: targetId, addresseeId: req.user.id }
  ] } });
  if (existing) return res.status(409).json({ message: "A friend request or connection already exists." });
  const friendship = await Friendship.create({ requesterId: req.user.id, addresseeId: targetId });
  res.status(201).json({ message: "Friend request sent.", friendship });
});

router.patch("/:id/respond", auth, async (req, res) => {
  const friendship = await Friendship.findByPk(req.params.id);
  if (!friendship || friendship.addresseeId !== req.user.id || friendship.status !== "pending") {
    return res.status(404).json({ message: "Pending request not found." });
  }
  if (!["accepted", "declined"].includes(req.body.status)) return res.status(400).json({ message: "Choose accepted or declined." });
  friendship.status = req.body.status;
  await friendship.save();
  res.json({ message: `Request ${friendship.status}.`, friendship });
});

module.exports = router;

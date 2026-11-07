const router = require("express").Router();
const { Op } = require("sequelize");
const { Message, Friendship, Block, User } = require("../models");
const auth = require("../middleware/auth");

router.get("/:userId", auth, async (req, res) => {
  const otherId = Number(req.params.userId);
  const friendship = await Friendship.findOne({ where: { status: "accepted", [Op.or]: [
    { requesterId: req.user.id, addresseeId: otherId }, { requesterId: otherId, addresseeId: req.user.id }
  ] } });
  const blocked = await Block.findOne({ where: { [Op.or]: [
    { blockerId: req.user.id, blockedId: otherId }, { blockerId: otherId, blockedId: req.user.id }
  ] } });
  if (!friendship || blocked) return res.status(403).json({ message: "Chat is available only with accepted friends." });
  const messages = await Message.findAll({
    where: { [Op.or]: [
      { senderId: req.user.id, receiverId: otherId }, { senderId: otherId, receiverId: req.user.id }
    ] },
    order: [["createdAt", "ASC"]], limit: 100
  });
  res.json({ messages });
});

router.post("/:userId", auth, async (req, res) => {
  const otherId = Number(req.params.userId);
  const content = String(req.body.content || "").trim();
  if (!content || content.length > 1000) return res.status(400).json({ message: "Message must be 1–1000 characters." });
  const friendship = await Friendship.findOne({ where: { status: "accepted", [Op.or]: [
    { requesterId: req.user.id, addresseeId: otherId }, { requesterId: otherId, addresseeId: req.user.id }
  ] } });
  const blocked = await Block.findOne({ where: { [Op.or]: [
    { blockerId: req.user.id, blockedId: otherId }, { blockerId: otherId, blockedId: req.user.id }
  ] } });
  if (!friendship || blocked) return res.status(403).json({ message: "Chat is available only with accepted friends." });
  const message = await Message.create({ senderId: req.user.id, receiverId: otherId, content });
  res.status(201).json({ message });
});

module.exports = router;

const router = require("express").Router();
const { Op } = require("sequelize");
const { Block, Report, Friendship, User } = require("../models");
const auth = require("../middleware/auth");

router.post("/block/:userId", auth, async (req, res) => {
  const blockedId = Number(req.params.userId);
  if (!Number.isInteger(blockedId) || blockedId === req.user.id) return res.status(400).json({ message: "Invalid user." });
  const target = await User.findByPk(blockedId);
  if (!target) return res.status(404).json({ message: "User not found." });
  await Block.findOrCreate({ where: { blockerId: req.user.id, blockedId } });
  await Friendship.destroy({ where: { [Op.or]: [
    { requesterId: req.user.id, addresseeId: blockedId }, { requesterId: blockedId, addresseeId: req.user.id }
  ] } });
  res.json({ message: "User blocked. You can no longer connect or chat." });
});

router.post("/report/:userId", auth, async (req, res) => {
  const reportedUserId = Number(req.params.userId);
  if (!Number.isInteger(reportedUserId) || reportedUserId === req.user.id) return res.status(400).json({ message: "Invalid user." });
  const allowed = ["harassment", "spam", "inappropriate", "impersonation", "other"];
  if (!allowed.includes(req.body.reason)) return res.status(400).json({ message: "Choose a report reason." });
  const target = await User.findByPk(reportedUserId);
  if (!target) return res.status(404).json({ message: "User not found." });
  const details = String(req.body.details || "").slice(0, 500);
  await Report.create({ reporterId: req.user.id, reportedUserId, reason: req.body.reason, details });
  res.status(201).json({ message: "Report submitted for review. If you feel unsafe, stop interacting and tell a trusted adult." });
});

module.exports = router;

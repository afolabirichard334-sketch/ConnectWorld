
require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { Op } = require("sequelize");

const { sequelize } = require("./backend/config/database");
const { User, Friendship, Message, Report, Block } = require("./backend/models");

const authRoutes = require("./backend/routes/authRoutes");
const userRoutes = require("./backend/routes/userRoutes");
const friendshipRoutes = require("./backend/routes/friendshipRoutes");
const messageRoutes = require("./backend/routes/messageRoutes");
const safetyRoutes = require("./backend/routes/safetyRoutes");

// ADMIN ROUTE
const adminRoutes = require("./backend/routes/adminRoutes");

const { authenticateSocket } = require("./backend/middleware/socketAuth");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ConnectWorld" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/safety", safetyRoutes);

// CONNECT ADMIN ROUTE
app.use("/api/admin", adminRoutes);

io.use(authenticateSocket);

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);

  socket.on("private_message", async (payload, acknowledge = () => {}) => {
    try {
      const receiverId = Number(payload?.receiverId);
      const content = String(payload?.content || "").trim();

      if (!Number.isInteger(receiverId) || !content || content.length > 1000) {
        return acknowledge({
          ok: false,
          message: "Enter a message of up to 1000 characters."
        });
      }

      if (receiverId === socket.user.id) {
        return acknowledge({
          ok: false,
          message: "You cannot message yourself."
        });
      }

      const friendship = await Friendship.findOne({
        where: {
          status: "accepted",
          [Op.or]: [
            { requesterId: socket.user.id, addresseeId: receiverId },
            { requesterId: receiverId, addresseeId: socket.user.id }
          ]
        }
      });

      const blocked = await Block.findOne({
        where: {
          [Op.or]: [
            { blockerId: socket.user.id, blockedId: receiverId },
            { blockerId: receiverId, blockedId: socket.user.id }
          ]
        }
      });

      if (!friendship || blocked) {
        return acknowledge({
          ok: false,
          message: "Messaging is available only between accepted friends."
        });
      }

      const message = await Message.create({
        senderId: socket.user.id,
        receiverId,
        content
      });

      const safeMessage = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt
      };

      io.to(`user:${receiverId}`).emit("new_message", safeMessage);

      acknowledge({ ok: true, message: safeMessage });
    } catch (error) {
      console.error("Socket message error:", error.message);
      acknowledge({
        ok: false,
        message: "Message could not be sent."
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");

    await sequelize.sync();
    console.log("Database tables synchronized successfully!");

    server.listen(PORT, () => {
      console.log(`ConnectWorld is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start ConnectWorld:", error.message);
    console.error("Check your MySQL service and .env settings.");
    process.exit(1);
  }
}

start();










// http://localhost:2025    : MEMBER
// http://localhost:2025/admin.html#members   : ADMINS
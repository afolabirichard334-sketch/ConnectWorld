const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(24), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  country: { type: DataTypes.STRING(80), allowNull: false },
  interests: { type: DataTypes.STRING(300), allowNull: false, defaultValue: "" },
  bio: { type: DataTypes.STRING(240), allowNull: false, defaultValue: "" },
  age: { type: DataTypes.INTEGER, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
});

const Friendship = sequelize.define("Friendship", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  requesterId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  addresseeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { type: DataTypes.ENUM("pending", "accepted", "declined"), allowNull: false, defaultValue: "pending" }
});

const Message = sequelize.define("Message", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  senderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  receiverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  content: { type: DataTypes.STRING(1000), allowNull: false }
});

const Report = sequelize.define("Report", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  reporterId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reportedUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reason: { type: DataTypes.ENUM("harassment", "spam", "inappropriate", "impersonation", "other"), allowNull: false },
  details: { type: DataTypes.STRING(500), allowNull: false, defaultValue: "" },
  status: { type: DataTypes.ENUM("open", "reviewed", "closed"), allowNull: false, defaultValue: "open" }
});

const Block = sequelize.define("Block", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  blockerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  blockedId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
});

User.hasMany(Friendship, { as: "sentRequests", foreignKey: "requesterId" });
Friendship.belongsTo(User, { as: "requester", foreignKey: "requesterId" });
User.hasMany(Friendship, { as: "receivedRequests", foreignKey: "addresseeId" });
Friendship.belongsTo(User, { as: "addressee", foreignKey: "addresseeId" });

User.hasMany(Message, { as: "sentMessages", foreignKey: "senderId" });
Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
User.hasMany(Message, { as: "receivedMessages", foreignKey: "receiverId" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });

User.hasMany(Report, { as: "submittedReports", foreignKey: "reporterId" });
Report.belongsTo(User, { as: "reporter", foreignKey: "reporterId" });
User.hasMany(Report, { as: "reportsAboutMe", foreignKey: "reportedUserId" });
Report.belongsTo(User, { as: "reportedUser", foreignKey: "reportedUserId" });

User.hasMany(Block, { as: "blocksMade", foreignKey: "blockerId" });
Block.belongsTo(User, { as: "blocker", foreignKey: "blockerId" });
User.hasMany(Block, { as: "blocksReceived", foreignKey: "blockedId" });
Block.belongsTo(User, { as: "blocked", foreignKey: "blockedId" });

module.exports = { User, Friendship, Message, Report, Block };

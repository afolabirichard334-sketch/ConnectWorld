
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

const caCertificate = fs.readFileSync(
  path.join(__dirname, "../../certs/ca.pem")
);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,

    dialectOptions: {
      ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
      }
    },

    define: {
      underscored: true
    }
  }
);

module.exports = { sequelize };

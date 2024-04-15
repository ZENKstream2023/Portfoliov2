const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
	token: {
		type: String,
		required: true,
		unique: true,
	},
	createdAt: {
		type: Date,
		expires: "1h", // El token se eliminará automáticamente después de 1 hora
		default: Date.now,
	},
});

const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);

module.exports = TokenBlacklist;

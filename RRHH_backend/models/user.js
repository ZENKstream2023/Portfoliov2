"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
	},
	password: {
		type: String,
		required: true,
	},
	hashedEmail: {
		type: String,
		required: true,
	},
	
	
});

// Middleware para cifrar la contraseña antes de guardarla en la base de datos
UserSchema.pre("save", async function (next) {
	try {
		if (!this.isModified("password")) {
			return next();
		}
		// Dentro del middleware pre-save en el modelo User
		console.log(
			"Contraseña antes de cifrar (dentro del middleware):",
			this.password,
		);
		const hashedPassword = await bcrypt.hash(this.password, 10);
		console.log("Contraseña cifrada:", hashedPassword);
		this.password = hashedPassword;
		return next();
	} catch (error) {
		return next(error);
	}
});

// Método para comparar contraseñas cifradas
UserSchema.methods.comparePassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;

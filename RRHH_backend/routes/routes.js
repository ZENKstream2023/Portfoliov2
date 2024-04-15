"use strict";
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");
// Rutas de Perfil
router.post("/signup", UserController.signup);
router.post("/signin", UserController.signin);

// Ruta de Logout
router.post(
	"/logout",
	//verifyToken,
	UserController.logout,
);
module.exports = router;

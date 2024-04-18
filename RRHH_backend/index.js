"use strict";
// Definir constantes
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const https = require("https"); // Importa el módulo HTTPS
const fs = require("fs");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3200;
const routes = require("./routes/routes");
const User = require("./models/user");
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
const options = {
	key: fs.readFileSync("localhost.key"), // Lee el archivo de clave privada
	cert: fs.readFileSync("localhost.crt"), // Lee el archivo de certificado
};
const { verifyToken } = require("./security/authMiddleware"); // Importa el middleware de autenticación

// Middleware de autenticación global
app.use(verifyToken);
// CORS
const corsOptions = {
	origin: "https://localhost:3200",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Content Security Policy
app.use((req, res, next) => {
	res.setHeader(
		"Content-Security-Policy",
		"script-src 'self' https://cdn.jsdelivr.net/; img-src 'self' http://localhost:3200;",
	);
	next();
});

// Sirve el frontend estático desde /var/www/frontend/dist
app.use(express.static(path.join(__dirname, "../Vue_FrontendV2/dist")));
// Middleware para servir archivos CSS con el tipo MIME correcto
app.use(
	"/assets/css",
	(req, res, next) => {
		res.setHeader("Content-Type", "text/css");
		next();
	},
	express.static(path.join(__dirname, "assets/css")),
);

// Middleware para servir archivos JS con el tipo MIME correcto
app.use(
	"/assets/js",
	(req, res, next) => {
		res.setHeader("Content-Type", "text/javascript");
		next();
	},
	express.static(path.join(__dirname, "assets/js")),
);

// Manejar todas las demás rutas y redirigirlas al archivo de entrada del frontend
// Middleware para excluir rutas que comiencen por "/api"
app.use((req, res, next) => {
	if (
		req.originalUrl.startsWith("/api") ||
		req.originalUrl.startsWith("/signup") ||
		req.originalUrl.startsWith("/signin")
	) {
		next();
	} else {
		// Construir la ruta absoluta al archivo index.html del frontend
		const indexPath = path.join(
			__dirname,
			"../Vue_FrontendV2/dist",
			"index.html",
		);
		res.sendFile(indexPath);
	}
});
app.use((req, res, next) => {
	console.log(req.body);
	bodyParser.json()(req, res, next);
});

// Rutas API
app.use("/", routes);
app.use((req, res, next) => {
	res.setHeader("Strict-Transport-Security", "max-age=31536000;");
	next();
});

// Conexión a la base de datos MongoDB
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log("Conexión a la base de datos establecida correctamente");
	})
	.catch((error) => {
		console.error("Error al conectar a la base de datos:", error.message);
	});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Error interno del servidor",
		message: err.message,
	});
});

// Crear el servidor HTTPS
https.createServer(options, app).listen(port, () => {
	console.log("El servidor está online"); // Inicia el servidor HTTPS en el puerto especificado
});

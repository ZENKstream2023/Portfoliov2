"use strict";
// Definir constantes
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http"); // Cambio a http en lugar de https
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
const { verifyToken } = require("./security/authMiddleware"); // Importa el middleware de autenticación

// Middleware de autenticación global
app.use(verifyToken);
// CORS
/*const corsOptions = {
	origin: "*",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
*/
app.use(bodyParser.json());

// Sirve el frontend estático desde /var/www/frontend/dist
app.use(express.static("../Vue_FrontendV2/dist"));
// Definir la política CSP
app.use((req, res, next) => {
	res.setHeader('Content-Security-Policy', "img-src 'self' ");
	next();
  });
  
  // Manejar todas las demás rutas y redirigirlas al archivo de entrada del frontend
  // Middleware para excluir rutas que comiencen por "/api"
  app.use((req, res, next) => {
	  if (req.originalUrl.startsWith("/api")) {
		  // Si la ruta comienza con "/api", pasa al siguiente middleware
		  next();
	  } else {
		  // Si la ruta no comienza con "/api", redirige al archivo de entrada del frontend
		  res.sendFile(path.join("../Vue_FrontendV2/dist/", "index.html"));
	  }
  });
  
  // Rutas API
  app.use("/api", routes);
  app.use((req, res, next) => {
	  res.setHeader("Strict-Transport-Security", "max-age=31536000;");
	  next();
  });

app.use((req, res, next) => {
	console.log(req.body);
	bodyParser.json()(req, res, next);
});

// Rutas API
app.use("/api", routes);

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

// Inicia el servidor HTTP en lugar del servidor HTTPS
http.createServer(app).listen(port, () => {
	console.log("El servidor está online");
});

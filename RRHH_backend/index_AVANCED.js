"use strict";
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const https = require("https");
const fs = require("fs");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 443;
const routes = require("./routes/routes");
const bot = require("./controllers/bot");
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
const { verifyToken } = require("./security/authMiddleware"); // Importa el middleware de autenticación

// Middleware de autenticación global
app.use(verifyToken);

/*// CORS
//app.use(cors());
const corsOptions = {
        origin: "http://godmod.es",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,

        optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
*/

// Sirve el frontend estático desde /var/www/frontend/dist
app.use(express.static("/var/www/frontend/dist"));
// Definir la política CSP
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "img-src 'self' https://*.jtvnw.net ttps://api.twitch.tv/*");
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
		res.sendFile(path.join("/var/www/frontend/dist/", "index.html"));
	}
});

// Rutas API
app.use("/api", routes);
app.use((req, res, next) => {
	res.setHeader("Strict-Transport-Security", "max-age=31536000;");
	next();
});
////////////////
// T W I T C H //
////////////////

// Define our dependencies
var session = require("express-session");
var passport = require("passport");
var OAuth2Strategy = require("passport-oauth").OAuth2Strategy;
var request = require("request");
const Channel = require("./models/channel");
// Definir constantes
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_CLIENT_SECRET;
const SESSION_SECRET = process.env.TWITCH_SESSION_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;
// Initialize Express and middlewares
app.use(
	session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }),
);
app.use(passport.initialize());
app.use(passport.session());
// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
	var options = {
		url: "https://api.twitch.tv/helix/users",
		method: "GET",
		headers: {
			"Client-ID": TWITCH_CLIENT_ID,
			Accept: "application/vnd.twitchtv.v5+json",
			Authorization: "Bearer " + accessToken,
		},
	};

	request(options, function (error, response, body) {
		if (response && response.statusCode == 200) {
			done(null, JSON.parse(body));
		} else {
			done(JSON.parse(body));
		}
	});
};

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (user, done) {
	done(null, user);
});

// Declaración de hashedAccessToken fuera de la función findOrCreateChannel
let hashedAccessToken;

// Función para generar un hash seguro de un token
const hashToken = async (token) => {
	const saltRounds = 10;
	const hashedToken = await bcrypt.hash(token, saltRounds);
	return hashedToken;
};

// Función para comparar un token con su hash
const compareToken = async (token, hash) => {
	const match = await bcrypt.compare(token, hash);
	return match;
};

// Define una función para buscar o crear un canal basado en el ID de Twitch
const findOrCreateChannel = async (accessToken, refreshToken, profile) => {
	try {
		const channel = await Channel.findOne({ twitchUserId: profile.data[0].id });
		if (!channel) {
			// Si el canal no existe, crea uno nuevo
			hashedAccessToken = await hashToken(accessToken);
			const hashedRefreshToken = await hashToken(refreshToken);

			const newChannel = new Channel({
				twitchUserId: profile.data[0].id,
				twitchUsername: profile.data[0].login,
				accessToken: accessToken,
				refreshToken: refreshToken,
				hashedAccessToken: hashedAccessToken,
				hashedRefreshToken: hashedRefreshToken,
				displayName: profile.data[0].display_name,
				email: profile.data[0].email,
				profileImageUrl: profile.data[0].profile_image_url,
				connected: true,
			});

			const savedChannel = await newChannel.save();
			return savedChannel;
		} else {
			// Si el canal ya existe, actualiza su información
			hashedAccessToken = await hashToken(accessToken);
			const hashedRefreshToken = await hashToken(refreshToken);

			channel.twitchUserId = profile.data[0].id;
			channel.twitchUsername = profile.data[0].login;
			channel.accessToken = accessToken;
			channel.refreshToken = refreshToken;
			channel.hashedAccessToken = hashedAccessToken;
			channel.hashedRefreshToken = hashedRefreshToken;
			channel.displayName = profile.data[0].display_name;
			channel.email = profile.data[0].email;
			channel.profileImageUrl = profile.data[0].profile_image_url;
			channel.connected = true;

			const savedChannel = await channel.save();
			return savedChannel;
		}
	} catch (error) {
		throw error;
	}
};
// Función para cifrar el token
const encryptToken = (token) => {
	const saltRounds = 10;
	return bcrypt.hashSync(token, saltRounds);
};

passport.use(
	"twitch",
	new OAuth2Strategy(
		{
			authorizationURL: "https://id.twitch.tv/oauth2/authorize",
			tokenURL: "https://id.twitch.tv/oauth2/token",
			clientID: TWITCH_CLIENT_ID,
			clientSecret: TWITCH_SECRET,
			callbackURL: CALLBACK_URL,
			state: true,
		},
		function (accessToken, refreshToken, profile, done) {
			// Buscar o crear un canal basado en el ID de Twitch
			findOrCreateChannel(accessToken, refreshToken, profile)
				.then((channel) => {
					done(null, channel);
				})
				.catch((error) => {
					console.error("Error al buscar o guardar el canal:", error);
					done(error);
				});
		},
	),
);

// Set route to start OAuth link, this is where you define scopes to request
app.get(
	"/api/auth/twitch",
	passport.authenticate("twitch", {
		scope: [
			// Acceso a analíticas de extensiones
			//'analytics:read:extensions',
			// Acceso a analíticas de juegos
			"analytics:read:games",
			// Acceso a bits
			//'bits:read',
			// Gestión de anuncios de canal
			//'channel:manage:ads',
			// Lectura de anuncios de canal
			//'channel:read:ads',
			// Gestión de transmisiones de canal
			//'channel:manage:broadcast',
			// Lectura de donaciones benéficas de canal
			//'channel:read:charity',
			// Edición de comerciales de canal
			//'channel:edit:commercial',
			// Lectura de editores de canal
			//'channel:read:editors',
			// Gestión de extensiones de canal
			//'channel:manage:extensions',
			// Lectura de metas de canal
			//'channel:read:goals',
			// Lectura de invitados estrella de canal
			//'channel:read:guest_star',
			// Gestión de invitados estrella de canal
			//'channel:manage:guest_star',
			// Lectura de trenes de hype de canal
			//'channel:read:hype_train',
			// Gestión de moderadores de canal
			//'channel:manage:moderators',
			// Lectura de encuestas de canal
			//'channel:read:polls',
			// Gestión de encuestas de canal
			//'channel:manage:polls',
			// Lectura de predicciones de canal
			//'channel:read:predictions',
			// Gestión de predicciones de canal
			//'channel:manage:predictions',
			// Gestión de redadas de canal
			// 'channel:manage:raids',
			// Lectura de redenciones de canal
			//'channel:read:redemptions',
			// Gestión de redenciones de canal
			//'channel:manage:redemptions',
			// Gestión de horarios de canal
			// 'channel:manage:schedule',
			// Lectura de clave de transmisión de canal
			// 'channel:read:stream_key',
			// Lectura de suscripciones de canal
			//'channel:read:subscriptions',
			// Gestión de vídeos de canal
			//'channel:manage:videos',
			// Lectura de VIPS de canal
			//'channel:read:vips',
			// Gestión de VIPS de canal
			//'channel:manage:vips',
			// Edición de clips
			//'clips:edit',
			// Lectura de moderación
			//'moderation:read',
			// Gestión de anuncios de moderador
			//'moderator:manage:announcements',
			// Gestión de automod de moderador
			//'moderator:manage:automod',
			// Lectura de configuraciones de automod de moderador
			//'moderator:read:automod_settings',
			// Gestión de configuraciones de automod de moderador
			//'moderator:manage:automod_settings',
			// Gestión de usuarios bloqueados por moderador
			//'moderator:manage:banned_users',
			// Lectura de términos bloqueados por moderador
			//'moderator:read:blocked_terms',
			// Gestión de términos bloqueados por moderador
			//'moderator:manage:blocked_terms',
			// Gestión de mensajes de chat por moderador
			//'moderator:manage:chat_messages',
			// Lectura de configuraciones de chat por moderador
			//'moderator:read:chat_settings',
			// Gestión de configuraciones de chat por moderador
			//'moderator:manage:chat_settings',
			// Lectura de espectadores activos por moderador
			//'moderator:read:chatters',
			// Lectura de seguidores por moderador
			//'moderator:read:followers',
			// Lectura de invitados estrella por moderador
			//'moderator:read:guest_star',
			// Gestión de invitados estrella por moderador
			//'moderator:manage:guest_star',
			// Lectura de modo de protección por moderador
			//'moderator:read:shield_mode',
			// Gestión de modo de protección por moderador
			//'moderator:manage:shield_mode',
			// Lectura de menciones por moderador
			//'moderator:read:shoutouts',
			// Gestión de menciones por moderador
			//'moderator:manage:shoutouts',
			// Lectura de solicitudes de desbloqueo por moderador
			//'moderator:read:unban_requests',
			// Gestión de solicitudes de desbloqueo por moderador
			//'moderator:manage:unban_requests',
			// Edición de usuario
			'user:edit',
			// Edición de seguimientos de usuario
			//'user:edit:follows',
			// Lectura de usuarios bloqueados
			//'user:read:blocked_users',
			// Gestión de usuarios bloqueados
			//'user:manage:blocked_users',
			// Lectura de transmisiones de usuario
			//'user:read:broadcast',
			// Gestión de color de chat de usuario
			//'user:manage:chat_color',
			// Lectura de chat de usuario
			//'user:read:chat',
			// Escritura de chat de usuario
			//'user:write:chat',
			// Lectura de correo electrónico de usuario
			//'user:read:email',
			// Lectura de emoticonos de usuario
			//'user:read:emotes',
			// Lectura de seguimientos de usuario
			//'user:read:follows',
			// Lectura de canales moderados de usuario
			//'user:read:moderated_channels',
			// Lectura de suscripciones de usuario
			//'user:read:subscriptions',
			// Gestión de susurros de usuario
			//'user:manage:whispers',
			// Bot de canal
			//'channel:bot',
			// Moderador de canal
			//'channel:moderate',
			// Edición de chat
			//'chat:edit',
			// Lectura de chat
			//'chat:read',
			// Bot de usuario
			//'user:bot',
			// Lectura de chat de usuario
			//'user:read:chat',
			// Escritura de chat de usuario
			//'user:write:chat',
			// Lectura de susurros
			//'whispers:read',
			// Escritura de susurros
			//'whispers:edit'
			// Agrega más ámbitos aquí según tus necesidades
		].join(" "),
	}),
);
// Set route for OAuth redirect
// Middleware para agregar el accessToken hasheado como cookie antes de la redirección
function addAccessTokenCookie(req, res, next) {
	// Verificar si el usuario está autenticado y tiene un accessToken
	if (
		req.isAuthenticated() &&
		req.session.passport &&
		req.session.passport.user
	) {
		// Agregar el accessToken hasheado como una cookie
		res.cookie("accessToken", hashedAccessToken, {
			httpOnly: true,
			secure: true,
		});
		next();
	} else {
		next();
	}
}
// Ruta para el callback de autenticación de Twitch
app.get(
	"/api/auth/twitch/callback",
	passport.authenticate("twitch", { failureRedirect: "/login" }),
	addAccessTokenCookie, // Ejecutar el middleware para agregar el accessToken como cookie
	function (req, res) {
		// Redirigir a /panel
		res.redirect("/channels");
	},
);
// If user has an authenticated session, display it, otherwise display link to authenticate
// Actualiza el controlador '/api/auth/login' para almacenar los datos del canal
app.get("/api/auth/login", function (req, res) {
	if (req.session && req.session.passport && req.session.passport.user) {
		res.json({ redirectTo: "/channels" });
	} else {
		// Si no hay un usuario autenticado, redirige a la página de autenticación de Twitch.
		res.json({ redirectTo: "/api/auth/twitch" });
	}
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Error interno del servidor",
		message: err.message,
	});
});

app.use((req, res, next) => {
	console.log(req.body); // Agrega este registro
	bodyParser.json()(req, res, next);
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

// Inicia el servidor HTTPS
https
	.createServer(
		{
			key: fs.readFileSync("/etc/letsencrypt/live/godmod.es/privkey.pem"),
			cert: fs.readFileSync("/etc/letsencrypt/live/godmod.es/fullchain.pem"),
		},
		app,
	)
	.listen(port, () => {
		console.log("Servidor GodStream está online");
	});

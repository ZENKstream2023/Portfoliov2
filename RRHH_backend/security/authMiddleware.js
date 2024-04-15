require("dotenv").config();
const bcrypt = require("bcrypt");
const allowedRoutes = process.env.ALLOWED_ROUTES.split(",");
const Channel = require("../models/user");

const isPathAllowed = (path) => {
    // Verifica si la ruta está permitida sin autenticación
    if (
        allowedRoutes.includes(path) ||
        path.startsWith(process.env.ALLOWED_TWITCH_ROUTES)
    ) {
        return true;
    }

    // Verifica si la ruta está dentro de la carpeta 'assets'
    if (path.startsWith('/assets')) {
        // Si la ruta está dentro de 'assets', se considera permitida
        return true;
    }

    return false;
};



const verifyToken = async (req, res, next) => {
 const requestedPath = req.path;

    if (isPathAllowed( requestedPath)) {
        return next();
    }
	// Obtener la cookie 'accessToken' de la cabecera de la solicitud
	const cookies = req.headers.cookie;
	// Verificar si hay cookies en la cabecera
	if (cookies) {
		// Separar las cookies en un objeto clave-valor
		const cookieObj = cookies.split(";").reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split("=");
			acc[key] = value;
			return acc;
		}, {});

		// Obtener el valor de la cookie 'accessToken'
		const accessToken = decodeURIComponent(cookieObj.accessToken);

		// Verifica si hay un token
		if (!accessToken) {
			// return res.status(403).json({ message: "Acceso no autorizado. Token no proporcionado." });
			return res.redirect("/api/auth/twitch");
		}

		try {
			// Obtiene el token almacenado desde la base de datos
			const channel = await Channel.findOne({
				hashedAccessToken: accessToken,
			}).select("accessToken");
			// Compara el token recibido en la cabecera con el token almacenado en tu base de datos usando bcrypt.compare
			const match = await bcrypt.compare(channel.accessToken, accessToken);

			if (!match) {
				return res.status(401).json({ message: "Token no válido." });
			}

			// Si el token coincide, puedes permitir que la solicitud continúe
			next();
		} catch (error) {
			console.error("Error al verificar el token:", error);
			return res.redirect("/api/auth/twitch");
			//return res.status(500).json({ message: "Error del servidor al verificar el token." });
		}
	} else {
		return res
			.status(403)
			.json({
				message:
					"Acceso no autorizado. No se encontraron cookies en la cabecera.",
			});
	}
};

module.exports = { verifyToken };

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Channel = require("../models/user");
const secretKey = process.env.MY_SECRET;
const allowedRoutes = process.env.ALLOWED_ROUTES.split(",");

const isPathAllowed = (path) => {
    // Verifica si la ruta está permitida sin autenticación
    if (
        allowedRoutes.includes(path) ||
        path.startsWith(process.env.ALLOWED_TWITCH_ROUTES)
    ) {
        return true;
    }

    // Verifica si la ruta está dentro de la carpeta 'assets'
    if (path.startsWith('/js')|| path.startsWith('/css')) {
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
    // Obtener el token de la cookie 'accessToken' en la cabecera de la solicitud
    const accessToken = req.cookies.accessToken;

    // Verificar si hay un token
    if (!accessToken) {
        return res.redirect("/login");
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(accessToken, secretKey);
			console.log("DECODED", decoded)
        // Extraer el valor original del token
        const hashedEmail = decoded.hashedEmail;
			console.log("HASHEDEMAIL ",hashedEmail)
        // Buscar el usuario en la base de datos usando el valor original del token
        const user = await Channel.findOne({ hashedEmail });
			console.log("USER ",user)
        // Verificar si se encontró un usuario
        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado." });
        }

        // Comparar el valor original del token con el email hasheado del usuario
        const match = await bcrypt.compare(user.email, hashedEmail);
			console.log(match)
        // Verificar si hay coincidencia
        if (!match) {
            return res.status(401).json({ message: "Token no válido." });
        }

        // Si todo está bien, permitir que la solicitud continúe
        next();
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.redirect("/login");
    }
};

module.exports = { verifyToken };
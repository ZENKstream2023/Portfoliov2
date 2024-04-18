"use strict";
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var User = require("../models/user");
const TokenBlacklist = require("../models/TokenBlacklist");
const secretKey = process.env.MY_SECRET;

const UserController = {

	signup: async (req, res) => {
		const { email, password } = req.body;
        console.log(email, password)
		try {
			// Verifica si se proporcionó una contraseña
			if (!password) {
				return res.status(400).send({
					status: "error",
					message: "La contraseña no se ha proporcionado correctamente",
				});
			}
	
			// Busca si ya existe un usuario con la dirección de correo electrónico proporcionada
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				// Si el usuario ya existe, devuelve un error
				return res.status(400).send({
					status: "error",
					message: "La dirección de correo electrónico ya está registrada",
				});
			}
            // Hashea el email
            const hashed = await bcrypt.hash(password, 10);

			console.log("Contraseña Hasheada: ", hashed)
			// Genera un token para el email Hasheado
			const token = jwt.sign({ hashed }, secretKey, { expiresIn: "1h" });
			
			console.log("Comprobado decodificación de Token, hashed es el mismo tras destokenizar")
            // Agrega el token como una cookie
            res.cookie("accessToken", token, {
				httpOnly: true,
				secure: true,
			});
			console.log("token sigue siendo el mismo token en las cookies")
			// Crea una nueva instancia de usuario
			const user = new User({
				email: email,
				password: hashed
			});
			// Guarda el usuario en la base de datos
			const userStored = await user.save();
            
			if (!userStored) {
				// Si no se puede guardar el usuario, devuelve un error
				return res.status(500).send({
					status: "error",
					message: "El usuario no se ha guardado",
				});
			}else{
                return res.status(200).send({
					status: "ok"
				});
            }
		} catch (error) {
			console.error("Error en el controlador signup:", error);
	
			// Manejo de errores específicos
			if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
				// Si el error es debido a una dirección de correo electrónico duplicada, devuelve un error
				return res.status(400).send({
					status: "error",
					message: "La dirección de correo electrónico ya está registrada",
				});
			}
	
			// En caso de otros errores, devuelve un error interno del servidor
			res.status(500).send({
				status: "error",
				message: "Error al registrar el usuario Backend",
			});
		}
	},
	signin: async (req, res) => {
		const { email, password} = req.body;
		if (!password) {
			return res.status(400).send({
				status: "error",
				message: "La contraseña no se ha proporcionado correctamente",
			});
		}

		try {
			const user = await User.findOne({ email: email });
			if (user) {
				const isMatch = await bcrypt.compare(password, user.password);
				if (isMatch) {
					            // Hashea el email
                                const hashed = await bcrypt.hash(password, 10);
                                user.password = hashed;
                                await user.save();
                                // Genera un token para el email Hasheado
                                const token = jwt.sign({ hashed }, secretKey, { expiresIn: "1h" });
                                // Agrega el token como una cookie
                                res.cookie("accessToken", token, {
                                    httpOnly: true,
                                    secure: true,
                                });
                                    return res.status(200).send({
                                        status: "ok"
                                    });

				}else {
					res.status(401).send("Credenciales incorrectas Backend");
				}
				} else {
					res.status(401).send("Credenciales incorrectas Backend");
				}
			} 
		 catch (error) {
			console.error("Error al autenticar el usuario:", error);
			res.status(500).send("Error al autenticar el usuario");
		}
	},
	
	// En tu controlador (controller.js)
	logout: async (req, res) => {

		try {
			// Obtener el token del encabezado de autorización
			const token = req.cookies.accessToken
			// Verificar si el token está en la lista de tokens inválidos
			const isTokenBlacklisted = await TokenBlacklist.findOne({ token });

			if (isTokenBlacklisted) {
				return res.status(401).send({
					status: "error",
					message: "Token ya ha sido invalidado",
				});
			}
			// Invalidar el token agregándolo a la lista de tokens inválidos
			const tokenBlacklist = new TokenBlacklist({ token });
			await tokenBlacklist.save();
			// Elimina la cookie 'accessToken'
			res.clearCookie('accessToken');
		} catch (error) {
			console.error("Error al cerrar sesión:", error);
			res.status(500).send({
				status: "error",
				message: "Error al cerrar sesión",
			});
		}
	}
};
module.exports = UserController;

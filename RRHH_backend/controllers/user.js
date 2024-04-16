"use strict";
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var User = require("../models/user");
const TokenBlacklist = require("../models/TokenBlacklist");
const secretKey = process.env.MY_SECRET;

//yourSecretKey
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
	
			// Genera un token para el usuario
			const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
            res.cookie("accessToken", token, {
				httpOnly: true,
				secure: true,
			});
			// Crea una nueva instancia de usuario
			const user = new User({
				email: email,
				password: password,
				accessToken: token,
			});
            console.log("user", user)
			// Guarda el usuario en la base de datos
			const userStored = await user.save();
            // Agrega el token como una cookie
            console.log("userstored", userStored)
            console.log("token", token)


			if (!userStored) {
				// Si no se puede guardar el usuario, devuelve un error
				return res.status(500).send({
					status: "error",
					message: "El usuario no se ha guardado",
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
			const user = await User.findOne({ email });
			if (user) {
				const isMatch = await bcrypt.compare(password, user.password);
				if (isMatch) {
					const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
					res.cookie("accessToken", token, { httpOnly: true, secure: false,});
						// Agrega el ID del cliente de Stripe al array client_id del usuario
						user.accessToken.push(token);
						await user.save();
						res.redirect("/panel");
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

/*
'use strict';
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const TokenBlacklist = require("../models/TokenBlacklist");
const secretKey = process.env.MY_SECRET;

// Definición de constantes para códigos de estado HTTP y mensajes de error
const HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500
};

const ERROR_MESSAGES = {
    MISSING_PASSWORD: "La contraseña no se ha proporcionado correctamente",
    EMAIL_ALREADY_REGISTERED: "La dirección de correo electrónico ya está registrada",
    USER_NOT_FOUND: "Credenciales incorrectas Backend",
    AUTHENTICATION_ERROR: "Error al autenticar el usuario",
    REGISTRATION_ERROR: "Error al registrar el usuario Backend",
    LOGOUT_ERROR: "Error al cerrar sesión"
};

const UserController = {
    // Función para registrar un nuevo usuario
    signup: async ({ body: { email, password } }, res) => {
        try {
            // Verifica si se proporcionó una contraseña
            if (!password) {
                return res.status(HTTP_STATUS.BAD_REQUEST).send({
                    status: "error",
                    message: ERROR_MESSAGES.MISSING_PASSWORD
                });
            }

            // Busca si ya existe un usuario con la dirección de correo electrónico proporcionada
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                // Si el usuario ya existe, devuelve un error
                return res.status(HTTP_STATUS.BAD_REQUEST).send({
                    status: "error",
                    message: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED
                });
            }

            // Genera un token para el usuario
            const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });

            // Crea una nueva instancia de usuario
            const user = new User({
                email: email,
                password: password,
                accessToken: token
            });

            // Guarda el usuario en la base de datos
            const userStored = await user.save();
            if (!userStored) {
                // Si no se puede guardar el usuario, devuelve un error
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
                    status: "error",
                    message: ERROR_MESSAGES.REGISTRATION_ERROR
                });
            }

            // Agrega el token como una cookie
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: true
            });

            // Redirecciona al panel de control
            res.redirect("/panel");
        } catch (error) {
            console.error("Error en el controlador signup:", error);

            // Manejo de errores específicos
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                // Si el error es debido a una dirección de correo electrónico duplicada, devuelve un error
                return res.status(HTTP_STATUS.BAD_REQUEST).send({
                    status: "error",
                    message: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED
                });
            }

            // En caso de otros errores, devuelve un error interno del servidor
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
                status: "error",
                message: ERROR_MESSAGES.REGISTRATION_ERROR
            });
        }
    },

    // Función para iniciar sesión de usuario
    signin: async ({ body: { email, password } }, res) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                // Si no se encuentra ningún usuario con las credenciales proporcionadas, devuelve un error
                return res.status(HTTP_STATUS.UNAUTHORIZED).send(ERROR_MESSAGES.USER_NOT_FOUND);
            }

            // Comprueba si la contraseña es válida
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Si la contraseña no coincide, devuelve un error
                return res.status(HTTP_STATUS.UNAUTHORIZED).send(ERROR_MESSAGES.USER_NOT_FOUND);
            }

            // Genera un token de acceso
            const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
            res.cookie("accessToken", token, { httpOnly: true, secure: true });

            // Agrega el token al usuario y guarda los cambios
            user.accessToken.push(token);
            await user.save();
            
            // Redirecciona al panel de control
            res.redirect("/panel");
        } catch (error) {
            console.error("Error al autenticar el usuario:", error);
            // Devuelve un error interno del servidor en caso de error
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ERROR_MESSAGES.AUTHENTICATION_ERROR);
        }
    },
    
    // Función para cerrar sesión de usuario
    logout: async (req, res) => {
        try {
            // Obtener el token del encabezado de autorización
            const token = req.cookies.accessToken;

            // Verificar si el token está en la lista de tokens inválidos
            const isTokenBlacklisted = await TokenBlacklist.findOne({ token });
            if (isTokenBlacklisted) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).send({
                    status: "error",
                    message: "Token ya ha sido invalidado"
                });
            }

            // Agregar el token a la lista de tokens inválidos
            const tokenBlacklist = new TokenBlacklist({ token });
            await tokenBlacklist.save();

            // Eliminar la cookie 'accessToken'
            res.clearCookie('accessToken');
            res.send('Cookies eliminadas');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            // Devuelve un error interno del servidor en caso de error
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
                status: "error",
                message: ERROR_MESSAGES.LOGOUT_ERROR
            });
        }
    }
};

module.exports = UserController;
 */
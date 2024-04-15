"use strict";
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var User = require("../models/user");
const TokenBlacklist = require("../models/TokenBlacklist");
const secretKey = process.env.MY_SECRET;

//yourSecretKey
const controller = {

	signup: async (req, res) => {
		const {
			email,
			password,
			userType,
			stripe_id,
			currentDomain,
		} = req.body;
		try {
			if (!password) {
				return res.status(400).send({
					status: "error",
					message: "La contraseña no se ha proporcionado correctamente",
				});
			}
	
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return res.status(400).send({
					status: "error",
					message: "La dirección de correo electrónico ya está registrada",
				});
			}
			// Crear instancia del usuario según el tipo
			let user;
			if (userType === "Bezeroa") {
				user = new User({
					email: email,
					password: password,
					userType: userType,
					client_id: stripe_id,
				});
			} else if (userType === "Negozioa") {
				user = new User({
					email: email,
					password: password,
					userType: userType,
					domain: currentDomain,
					commerce_id: stripe_id,
				});
			}
	
			const userStored = await user.save();
			if (!userStored) {
				return res.status(500).send({
					status: "error",
					message: "El usuario no se ha guardado",
				});
			}
	
			// Genera el token después de registrar con éxito al usuario
			const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
			return res.status(201).send({
				status: "Usuario registrado con éxito",
				token: token,
				userType: userType,
			});
	
		} catch (error) {
			console.error("Error en el controlador signup:", error);
	
			if (error.code === 11000) {
				return res.status(400).send({
					status: "error",
					message: "La dirección de correo electrónico ya está registrada",
				});
			}
	
			res.status(500).send({
				status: "error",
				message: "Error al registrar el usuario Backend",
			});
		}
	},
	signin: async (req, res) => {
		const { email, password, initialCommerceId} = req.body;
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
					if(user.userType === "Bezeroa"){
					// Aquí debes determinar el ID del comercio en función del contexto de la sesión
					const commerceId = initialCommerceId;
					// Obtén la lista de todos los clientes asociados a este comercio
					const allClientes = await stripe.customers.list();
					// Filtra los clientes que tienen el mismo comercio_id en sus metadatos
					const comercioClientes = allClientes.data.filter(
						(cliente) => cliente.metadata.comercio_id === commerceId,
					);
					// Verifica si el correo electrónico ya está asociado a un cliente en este comercio
					const emailExists = comercioClientes.some(
						(cliente) => cliente.email === email,
					);
					if (!emailExists) {
						// Si el correo electrónico no está asociado a un cliente en este comercio, crea un nuevo cliente
						console.log(
							"EL EMAIL NO EXISTÍA PARA ESTE COMERCIO Y HA SIDO CREADO",
						);
						const cliente = await stripe.customers.create({
							email: email,
							metadata: {
								comercio_id: commerceId,
							},
						});
						// Agrega el ID del cliente de Stripe al array client_id del usuario
						user.client_id.push(cliente.id);
						await user.save();
					}
				}

					const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
					const userType = user.userType;
					res.cookie("jwt", token, { httpOnly: true });
					res.status(200).json({ token, userType });
				} else {
					res.status(401).send("Credenciales incorrectas Backend");
				}
			} else {
				res.status(401).send("Credenciales incorrectas Backend");
			}
		} catch (error) {
			console.error("Error al autenticar el usuario:", error);
			res.status(500).send("Error al autenticar el usuario");
		}
	},
	
	// En tu controlador (controller.js)
	logout: async (req, res) => {
        // Elimina la cookie 'accessToken'
        res.clearCookie('accessToken');
        // Envía una respuesta al cliente
    res.send('Cookies eliminadas');
		try {
			// Obtener el token del encabezado de autorización
			const token = req.header("Authorization").replace("Bearer ", "");
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

			res.status(200).send({
				status: "success",
				message: "Sesión cerrada con éxito",
			});
		} catch (error) {
			console.error("Error al cerrar sesión:", error);
			res.status(500).send({
				status: "error",
				message: "Error al cerrar sesión",
			});
		}
	}
};
module.exports = controller;
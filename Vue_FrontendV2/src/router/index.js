import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
const routes = [
	{
		path: "/",
		name: "home",
		component: HomeView,
	},
	{
		path: "/locations",
		name: "ListLocations",
		component: () =>
			import(
				/* webpackChunkName: "ListLocations" */ "../components/ListLocations"
			),
	},
	{
		path: "/login",
		name: "LoginView",
		component: () =>
			import(/* webpackChunkName: "ListLocations" */ "../components/Login"),
	},
	{
		path: "/panel",
		name: "PanelView",
		component: () =>
			import(/* webpackChunkName: "ListLocations" */ "../components/Panel"),
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
});

export default router;

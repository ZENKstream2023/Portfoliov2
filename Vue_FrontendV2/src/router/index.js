import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ListLocations from "../components/ListLocations";
import LoginView from "../components/Login";
import PanelView from "../components/Panel";
const routes = [
	{
		path: "/",
		name: "home",
		component: HomeView,
	},
	{
		path: "/locations",
		name: "ListLocations",
		component: ListLocations,
		/*component: () =>
			import(
				 "../components/ListLocations"
			),
			*/
	},
	{
		path: "/login",
		name: "LoginView",
		component: LoginView,
		/*component: () =>
			"../components/Login"),*/
	},
	{
		path: "/panel",
		name: "PanelView",
		component: PanelView,
		/*component: () =>
			import(*//* webpackChunkName: "ListLocations" *//* "../components/Panel"),*/
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
});

export default router;

import { Router } from "express";

import { setMiscRoutes } from "./misc";

export const setAppRoutes = (router: Router) => {
	setMiscRoutes(router);
};

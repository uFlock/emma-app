import { Router } from "express";

import { NotFoundError } from "../../errors/not-found-error";

export const setMiscRoutes = (router: Router) => {

	router.get('/alive', (req, res) => res
		.status(200)
		.send('It Lives'));

	router.all("*", () => {
		throw new NotFoundError();
	});
};

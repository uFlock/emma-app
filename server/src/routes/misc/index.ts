import { Router } from "express";

import { NotFoundError } from "../../errors/not-found-error";

export const ROOT_LEVEL_MESSAGE_PAYLOAD = "Referral System - Technical Task for Emma-App";
export const IT_LIVES_MESSAGE_PAYLOAD = "It Lives";

export const setMiscRoutes = (router: Router) => {

	router.get('/', (req, res) => res
		.status(200)
		.send(ROOT_LEVEL_MESSAGE_PAYLOAD));

	router.get('/alive', (req, res) => res
		.status(200)
		.send(IT_LIVES_MESSAGE_PAYLOAD));

	router.all("*", () => {
		throw new NotFoundError();
	});
};

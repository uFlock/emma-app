import { Router, Request, Response } from "express";

import { validateBody, validateRequest } from "../../../middlewares";

import { schema } from "./routeSchema";

export const claimFreeShare = (router: Router) => router
	.post(
		"/claim-free-share",
		validateBody(schema),
		validateRequest,
		routeHandler
	);

async function routeHandler(req: Request, res: Response) {

	const { email } = req.body;

	res.send({ email });
}
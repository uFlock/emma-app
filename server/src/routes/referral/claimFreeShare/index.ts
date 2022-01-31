import { Router, Request, Response } from "express";

import { validateBody, validateRequest } from "../../../middlewares";
import { User } from "../../../models/user";

import { schema } from "./routeSchema";
import { generateUser } from "../../../modules/data-populator";

export const claimFreeShare = (router: Router) => router
	.post(
		"/claim-free-share",
		validateBody(schema),
		validateRequest,
		routeHandler
	);

async function routeHandler(req: Request, res: Response) {

	const { email } = req.body;

	const user = await getOrCreateUser(email);

	res.send({ email });
}

//created for simplicity - so no need to register users
async function getOrCreateUser(email: string) {

	const existingUser = await User.findOne({ email });
	const userExists = !!existingUser;

	return userExists ? existingUser : await User
		.build(generateUser(email))
		.save();
}
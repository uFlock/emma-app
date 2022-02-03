import { Router, Request, Response } from "express";

import { generateUser } from "../../../modules/data-populator";
import { validateBody } from "../../../middlewares";
import { awardReferralShare } from "../../../modules/referral-manager";
import { User } from "../../../models/user";
import { getReferralsConfig } from "../../../modules/environment";

import { schema } from "./routeSchema";

export const claimFreeShare = (router: Router) => router
	.post(
		"/claim-free-share",
		validateBody(schema),
		routeHandler
	);

async function routeHandler(req: Request, res: Response) {

	const { email } = req.body;

	const user = await getOrCreateUser(email);

	const { cpa: { minCpaSharePrice, value: CPA }, chances } = getReferralsConfig();

	const result = await awardReferralShare({
		user,
		minCpaSharePrice,
		CPA,
		chances
	});

	const updatedUser = await getOrCreateUser(email);

	res.send({ ...result, details: { ...result.details, user: updatedUser } });
}

//created for simplicity - so no need to register users
async function getOrCreateUser(email: string) {

	const existingUser = await User.findOne({ email });
	const userExists = !!existingUser;

	return userExists ? existingUser : await User
		.build(generateUser(email))
		.save();
}

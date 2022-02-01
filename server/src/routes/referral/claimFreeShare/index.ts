import { Router, Request, Response } from "express";

import { generateUser } from "../../../modules/data-populator";
import { validateBody, validateRequest } from "../../../middlewares";
import { getReferralsConfig } from "../../../modules/environment";
import { calculateOutcome, ChanceSettings, getRandomInt } from "../../../utils/chance-calculator";
import { User, UserAttributes } from "../../../models/user";
import { TickerPrice, Broker, Ticker } from "../../../modules/emma-broker";

import { schema } from "./routeSchema";

const REFERRALS_CONFIG = getReferralsConfig();

const broker = new Broker();

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
	const outcome = calculateOutcome(REFERRALS_CONFIG.chances);

	const shareAwarded = await awardShareToUserInPriceRange(user, outcome);

	res.send({ user, outcome, shareAwarded });
}

//created for simplicity - so no need to register users
async function getOrCreateUser(email: string) {

	const existingUser = await User.findOne({ email });
	const userExists = !!existingUser;

	return userExists ? existingUser : await User
		.build(generateUser(email))
		.save();
}

//@TODO abstract into emma-referral module
async function awardShareToUserInPriceRange(user: UserAttributes, outcome: ChanceSettings): Promise<(Ticker & TickerPrice)> {

	const { min, max } = outcome.result;

	const sharesInRewardsAccount = await broker.getRewardsAccountPositions();
	const rewardAccountSharesInPriceRange = getSharesInPriceRange(sharesInRewardsAccount, min, max);

	const randomShare = getRandomItemFromArray(rewardAccountSharesInPriceRange);

	if (randomShare) {

		const result = await broker
			.moveSharesFromRewardsAccount(user.email, randomShare.tickerSymbol, 1);

		return result.success ? randomShare : awardShareToUserInPriceRange(user, outcome);
	}

	return buyRandomShareInPriceRange(user, outcome);
}

async function buyRandomShareInPriceRange(user: UserAttributes, outcome: ChanceSettings) {

	const { min, max } = outcome.result;

	const availableTickers = await broker.listTradableAssets();
	const availableTickersWithPrice = await broker.addPriceToTickers(availableTickers);

	const availableSharesToBuyInPriceRange = getSharesInPriceRange(availableTickersWithPrice, min, max);
	const randomShare = getRandomItemFromArray(availableSharesToBuyInPriceRange);

	await broker.buySharesInRewardsAccount(randomShare.tickerSymbol, 1);

	return awardShareToUserInPriceRange(user, outcome);
}

function getSharesInPriceRange(pricedTickers: (Ticker & TickerPrice)[], min: number, max: number) {
	return pricedTickers.filter(share =>
		share.sharePrice >= min && share.sharePrice <= max);
}

function getRandomItemFromArray(array: any[]) {

	const arrayLength = array.length;
	const randomIndex = getRandomInt(arrayLength);

	return arrayLength > 0 ? array[randomIndex] : null;
}
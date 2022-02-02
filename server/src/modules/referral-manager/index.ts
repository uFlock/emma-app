import { UserAttributes } from "../../models/user";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";
import { getRandomItemFromArray, toFloat } from "../../utils/common";

import { calculateOutcome } from "../chance-calculator";
import { Broker, Ticker, TickerPrice } from "../emma-broker";
import { getReferralsConfig } from "../environment";

const broker = new Broker();

export async function awardReferralShare(user: UserAttributes, minCpaSharePrice?: number) {

	const config = getReferralsConfig();

	const CPA = config.cpa.value;
	const MIN_CPA_SHARE_PRICE = config.cpa.minCpaSharePrice;

	return CPA ?
		await awardShareToUserUsingCPA(user, minCpaSharePrice || MIN_CPA_SHARE_PRICE) :
		await awardShareToUserUsingPercentSettings(user);
}

export async function awardShareToUserUsingPercentSettings(user: UserAttributes) {

	const outcome = calculateOutcome(getReferralsConfig().chances);
	const { min, max } = outcome.result;

	const shareAwarded = await awardShareToUserInPriceRange(user, min, max);

	return { outcome, shareAwarded };
}

export async function awardShareToUserUsingCPA(user: UserAttributes, minCpaSharePrice = 3) {

	const referralAggregation = await getReferralTransactionsAggregation();
	const { currentCpa, targetCpa, allowedMaxPrice } = calculateCpaValues(referralAggregation);

	const shareAwarded = await awardShareToUserInPriceRange(user, minCpaSharePrice, allowedMaxPrice);

	return { referralAggregation, currentCpa, targetCpa, allowedMaxPrice, shareAwarded };
}

async function getReferralTransactionsAggregation() {

	const referralTransactions = await Transaction.aggregate([
		{
			$match: { type: TRANSACTION_TYPES.REFERRAL }
		},
		{
			$group: {
				_id: "referral transactions",
				numberOfTransactions: {
					$count: {}
				},
				totalValue: {
					$sum: "$totalValue"
				}
			}
		}
	]);

	return referralTransactions[0];
}

function calculateCpaValues(referralAggregation: { numberOfTransactions: number, totalValue: number } | undefined) {

	const CPA = getReferralsConfig().cpa.value;

	const cpaAdjustment = referralAggregation ? CPA : 0; //don't adjust the very first claim
	const defaultReferralAggregation = { numberOfTransactions: 1, totalValue: 0 };
	const { numberOfTransactions, totalValue } = referralAggregation || defaultReferralAggregation;

	const currentCpa = toFloat(totalValue / numberOfTransactions);
	const allowedMaxPrice = toFloat((CPA - currentCpa) * (numberOfTransactions) + cpaAdjustment);

	return { currentCpa, targetCpa: CPA, allowedMaxPrice };
}

async function awardShareToUserInPriceRange(user: UserAttributes, min: number, max: number): Promise<(Ticker & TickerPrice)> {

	const sharesInRewardsAccount = await broker.getRewardsAccountPositions();
	const rewardAccountSharesInPriceRange = getSharesInPriceRange(sharesInRewardsAccount, min, max);

	const randomShare = getRandomItemFromArray(rewardAccountSharesInPriceRange);

	if (randomShare) {

		const result = await broker
			.moveSharesFromRewardsAccount(user.email, randomShare.tickerSymbol, 1);

		return result.success ? randomShare : awardShareToUserInPriceRange(user, min, max);
	}

	return buyRandomShareInPriceRange(user, min, max);
}

async function buyRandomShareInPriceRange(user: UserAttributes, min: number, max: number) {

	const availableTickers = await broker.listTradableAssets();
	const availableTickersWithPrice = await broker.addPriceToTickers(availableTickers);

	const availableSharesToBuyInPriceRange = getSharesInPriceRange(availableTickersWithPrice, min, max);
	const randomShare = getRandomItemFromArray(availableSharesToBuyInPriceRange);

	await broker.buySharesInRewardsAccount(randomShare.tickerSymbol, 1);

	return awardShareToUserInPriceRange(user, min, max);
}

function getSharesInPriceRange(pricedTickers: (Ticker & TickerPrice)[], min: number, max: number) {
	return pricedTickers.filter(share =>
		share.sharePrice >= min && share.sharePrice <= max);
}

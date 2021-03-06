import { UserAttributes } from "../../models/user";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";
import { getRandomItemFromArray, toFloat } from "../../utils/common";

import { calculateOutcome, ChanceSettings } from "../chance-calculator";
import { Broker, Ticker, TickerPrice } from "../emma-broker";

const broker = new Broker();

export interface AwardReferralShareProps {
	user: UserAttributes;
	CPA?: number;
	minCpaSharePrice?: number;
	chances: ChanceSettings[];
}

export enum REFERRAL_ALGORITHMS {
	CPA = "CPA",
	PERCENTAGE = "PERCENTAGE"
}

export const CPA_VALUE_ERROR = "CPA target must be a positive number";
export const MIN_CPA_SHARE_PRICE_ERROR = "minCpaSharePrice must be a positive number";
export const CPA_CAN_NOT_BE_LESS_THAN_MIN_PRICE_ERROR = "CPA can't be less than minCpaSharePrice";
export const NO_SHARE_IN_PRICE_RANGE_ON_THE_MARKET_ERROR = "No shares matching the price range on the market";

export async function awardReferralShare(props: AwardReferralShareProps) {

	const { user, chances, CPA, minCpaSharePrice } = props;

	return CPA ?
		await awardShareToUserUsingCPA(user, CPA, minCpaSharePrice) :
		await awardShareToUserUsingPercentSettings(user, chances);
}

export async function awardShareToUserUsingPercentSettings(user: UserAttributes, chances: ChanceSettings[]) {

	const outcome = calculateOutcome(chances);
	const { min, max } = outcome.result;

	const shareAwarded = await awardShareToUserInPriceRange(user, min, max);

	return { algorithm: REFERRAL_ALGORITHMS.PERCENTAGE, shareAwarded, details: { outcome } };
}

export async function awardShareToUserUsingCPA(user: UserAttributes, CPA: number, minCpaSharePrice = 3) {

	validateCpaValues(CPA, minCpaSharePrice);

	const referralAggregation = await getReferralTransactionsAggregation();
	const { currentCpa, targetCpa, allowedMaxPrice } = calculateCpaValues(referralAggregation, CPA);

	const shareAwarded = await awardShareToUserInPriceRange(user, minCpaSharePrice, allowedMaxPrice);

	return {
		algorithm: REFERRAL_ALGORITHMS.CPA,
		shareAwarded,
		details: {
			referralAggregation,
			currentCpa,
			targetCpa,
			allowedMaxPrice
		}
	};
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

function calculateCpaValues(referralAggregation: { numberOfTransactions: number, totalValue: number }, CPA: number) {

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

	if (!randomShare) throw new Error(NO_SHARE_IN_PRICE_RANGE_ON_THE_MARKET_ERROR);

	await broker.buySharesInRewardsAccount(randomShare.tickerSymbol, 1);

	return awardShareToUserInPriceRange(user, min, max);
}

function getSharesInPriceRange(pricedTickers: (Ticker & TickerPrice)[], min: number, max: number) {
	return pricedTickers.filter(share =>
		share.sharePrice >= min && share.sharePrice <= max);
}

function validateCpaValues(CPA?: number, minCpaSharePrice?: number) {
	if (!!CPA && CPA < 0) throw new Error(CPA_VALUE_ERROR);
	if (!!minCpaSharePrice && minCpaSharePrice < 0) throw new Error(MIN_CPA_SHARE_PRICE_ERROR);
	if (!!CPA && !!minCpaSharePrice && CPA < minCpaSharePrice) throw new Error(CPA_CAN_NOT_BE_LESS_THAN_MIN_PRICE_ERROR);
}

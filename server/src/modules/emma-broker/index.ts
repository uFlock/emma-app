import { DateTime } from "luxon";

import { Asset, User } from "../../models/user";
import { FAKE_BROKER, FAKE_REWARDS_ACCOUNT } from "../../constants";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";

import { FAKE_MARKET } from "../../constants";

export const QUANTITY_ERROR = "quantity must be greater than 0 and be an Integer value";
export const MARKET_CLOSED_ERROR = "Market is closed or is about to close.";

interface CreateTransactionPayload {
	type: TRANSACTION_TYPES,
	fromAccount: string
	toAccount: string
	tickerSymbol: string
	unitPrice: number
	quantity: number
}

export interface Ticker {
	tickerSymbol: string;
}

export interface TickerPrice {
	sharePrice: number;
}

export interface MarketClosureStatus {
	open: boolean;
	nextOpeningTime: string;
	nextClosingTime: string;
}

export interface BuyRewardSharesResponse {
	success: boolean;
	sharePricePaid: number;
}

export interface MoveShareToAccountResponse {
	success: boolean;
}

export class Broker {

	// To fetch a list of assets available for trading
	public listTradableAssets = async () => FAKE_MARKET.map(asset =>
		({ tickerSymbol: asset.tickerSymbol }));

	// To fetch the latest price for an asset
	public getLatestPrice = async (tickerSymbol: string): Promise<TickerPrice> => FAKE_MARKET
		.filter(asset => asset.tickerSymbol === tickerSymbol)
		.map(asset => ({ sharePrice: asset.sharePrice }))
		.at(0)!;

	// market never sleeps
	public isMarketOpen = async (): Promise<MarketClosureStatus> => ({
		open: true,
		nextOpeningTime: DateTime.now().minus({ hour: 24 }).toISO(),
		nextClosingTime: DateTime.now().plus({ hour: 8 }).toISO()
	});

	// To purchase a share in our Firm's rewards account.
	// NOTE: this works only while the stock market is open otherwise throws an error.
	// NOTE 2: quantity is an integer, no fractional shares allowed.
	public buySharesInRewardsAccount = async (tickerSymbol: string, quantity: number): Promise<BuyRewardSharesResponse> => {

		const quantityIsInvalid = quantity <= 0 || !Number.isInteger(quantity);

		if (quantityIsInvalid) throw new Error(QUANTITY_ERROR);

		const marketStatus = await this.isMarketOpen();
		const marketIsOpen = marketIsOpenLongEnoughToTrade(marketStatus);

		if (!marketIsOpen) throw new Error(MARKET_CLOSED_ERROR);

		const { sharePrice: unitPrice } = await this.getLatestPrice(tickerSymbol);

		const payload: CreateTransactionPayload = {
			type: TRANSACTION_TYPES.BUY,
			fromAccount: FAKE_BROKER,
			toAccount: FAKE_REWARDS_ACCOUNT.email,
			tickerSymbol,
			unitPrice,
			quantity
		};

		await createTransaction(payload);

		const success = await putShareIntoAccount(FAKE_REWARDS_ACCOUNT.email, tickerSymbol, quantity);

		return { success, sharePricePaid: unitPrice }; //assumed this is price per share and not unitPrice * quantity
	};

	// To view the shares that are available in the Firm's rewards account
	public getRewardsAccountPositions = async () => {

		const rewardsAccount = await User.findOne({ email: FAKE_REWARDS_ACCOUNT.email });

		return await this.addPriceToTickers(rewardsAccount!.shares);
	};

	// To move shares from our Firm's rewards account to a user's own account
	public moveSharesFromRewardsAccount = async (toAccount: string, tickerSymbol: string, quantity: number): Promise<MoveShareToAccountResponse> => {

		const { sharePrice: unitPrice } = await this.getLatestPrice(tickerSymbol);
		const successTakingShare = await takeShareFromRewardAccount(tickerSymbol, quantity);

		if (!successTakingShare) return { success: successTakingShare };

		const payload: CreateTransactionPayload = {
			type: TRANSACTION_TYPES.REFERRAL,
			fromAccount: FAKE_REWARDS_ACCOUNT.email,
			toAccount,
			tickerSymbol,
			unitPrice,
			quantity
		};

		await createTransaction(payload);

		const success = await putShareIntoAccount(toAccount, tickerSymbol, quantity);

		return { success };
	};

	public addPriceToTickers = async (tickers: (Ticker | Asset)[]) => {

		const jobs = tickers.map(ticker => this.addPriceToTicker(ticker));

		return await Promise.all(jobs);
	};

	public addPriceToTicker = async (ticker: Ticker | Asset) => {

		const { sharePrice } = await this.getLatestPrice(ticker.tickerSymbol);

		return { ...ticker, sharePrice };
	};
}

//check if market is closing in over 5 minutes
export function marketIsOpenLongEnoughToTrade(marketStatus: MarketClosureStatus) {

	const { open, nextClosingTime } = marketStatus;

	return open && DateTime.fromISO(nextClosingTime)
		.diffNow("minutes")
		.toObject()
		.minutes! >= 5;
}

async function takeShareFromRewardAccount(tickerSymbol: string, quantity: number) {

	const result = await User.updateOne(
		{
			email: FAKE_REWARDS_ACCOUNT.email,
			shares: {
				$elemMatch: {
					tickerSymbol,
					quantity: { $gte: quantity }
				}
			}
		},
		{
			$inc: { "shares.$.quantity": -quantity }
		}
	);

	//clean up shares
	await removeSharesThatDoNotExistAnymore();

	return result.modifiedCount === 1;
}

async function removeSharesThatDoNotExistAnymore() {

	const result = await User
		.updateOne(
			{ email: FAKE_REWARDS_ACCOUNT.email, },
			{ $pull: { shares: { quantity: 0 } } }
		);

	return result.modifiedCount === 1;
}

async function putShareIntoAccount(toAccount: string, tickerSymbol: string, quantity: number) {

	return await updateShareQuantityIfExists(toAccount, tickerSymbol, quantity) ||
		await addShareToAccount(toAccount, tickerSymbol, quantity);
}

async function updateShareQuantityIfExists(toAccount: string, tickerSymbol: string, quantity: number) {

	const result = await User.findOneAndUpdate(
		{
			email: toAccount,
			shares: {
				$elemMatch: {
					tickerSymbol
				}
			}
		},
		{ $inc: { "shares.$.quantity": quantity } },
		{ new: true }
	);

	return !!result;
}

async function addShareToAccount(toAccount: string, tickerSymbol: string, quantity: number) {

	const result = await User.findOneAndUpdate(
		{ email: toAccount },
		{
			$addToSet: {
				shares: {
					tickerSymbol,
					quantity
				}
			},
		},
		{ new: true });

	return !!result;
}

async function createTransaction(payload: CreateTransactionPayload) {
	return !!await Transaction
		.build({ ...payload, totalValue: payload.unitPrice * payload.quantity })
		.save();
}
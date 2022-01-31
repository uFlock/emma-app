import { DateTime } from "luxon";

import { User } from "../../models/user";
import { FAKE_REWARDS_ACCOUNT } from "../data-populator";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";

import { fakeMarket } from "./fake-market";

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

export interface AvailableTradingAsset {
	tickerSymbol: string;
}

export interface AssetPrice {
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

export interface AvailableRewardAsset {
	tickerSymbol: string;
	quantity: number;
	sharePrice: number;
}

export class Broker {

	// To fetch a list of assets available for trading
	public listTradableAssets = async (): Promise<AvailableTradingAsset[]> => fakeMarket.map(asset =>
		({ tickerSymbol: asset.tickerSymbol }));

	// To fetch the latest price for an asset
	public getLatestPrice = async (tickerSymbol: string): Promise<AssetPrice> => fakeMarket
		.filter(asset => asset.tickerSymbol === tickerSymbol)
		.map(asset => ({ sharePrice: asset.sharePrice }))
		.at(0)!;

	// To fetch the latest price for an asset
	public isMarketOpen = async (): Promise<MarketClosureStatus> => ({
		open: true,
		nextOpeningTime: DateTime.now().toISO(),
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
			fromAccount: "BROKER",
			toAccount: FAKE_REWARDS_ACCOUNT.email,
			tickerSymbol,
			unitPrice,
			quantity
		};

		await createTransaction(payload);

		return { success: true, sharePricePaid: unitPrice * quantity };
	};

	// To view the shares that are available in the Firm's rewards account
	public getRewardsAccountPositions = async (): Promise<AvailableRewardAsset[]> => {

		const rewardsAccount = await User.findOne({ email: FAKE_REWARDS_ACCOUNT.email });

		return rewardsAccount!.shares;
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

	const result = await User.updateOne({
			email: FAKE_REWARDS_ACCOUNT.email,
			shares: {
				$elemMatch: {
					tickerSymbol,
					quantity: { $gte: quantity }
				}
			}
		}, {
			$inc: { "shares.$.quantity": -quantity }
		}
	);

	return result.modifiedCount === 1;
}

async function putShareIntoAccount(toAccount: string, tickerSymbol: string, quantity: number) {

	return await updateShareQuantityIfExists(toAccount, tickerSymbol, quantity) ||
		await addShareToAccount(toAccount, tickerSymbol, quantity);
}

async function updateShareQuantityIfExists(toAccount: string, tickerSymbol: string, quantity: number) {

	const result = await User.findOneAndUpdate({
			email: toAccount,
			shares: {
				$elemMatch: {
					tickerSymbol
				}
			}
		}, {
			$inc: { "shares.$.quantity": quantity }
		},
		{
			new: true
		}
	);

	return !!result;
}

async function addShareToAccount(toAccount: string, tickerSymbol: string, quantity: number) {

	const result = await User.findOneAndUpdate({
		email: toAccount,
	}, {
		$addToSet: {
			shares: {
				tickerSymbol,
				quantity
			}
		},

	}, {
		new: true
	});

	return !!result;
}

async function createTransaction(payload: CreateTransactionPayload) {

	const {
		type,
		tickerSymbol,
		fromAccount,
		toAccount,
		unitPrice,
		quantity
	} = payload;

	const result = await Transaction
		.build({
			type,
			tickerSymbol,
			fromAccount,
			toAccount,
			unitPrice: unitPrice,
			totalValue: unitPrice * quantity,
			quantity
		})
		.save();

	return !!result;
}
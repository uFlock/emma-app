import { DateTime } from "luxon";

import { FAKE_BROKER, FAKE_MARKET, FAKE_REWARDS_ACCOUNT } from "../../constants";
import { getRandomItemFromArray } from "../../utils/common";
import { createTestUser } from "../../test/helpers";
import { TEST_USER_EMAIL } from "../../test/constants";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";
import { User } from "../../models/user";

import { createRewardsAccount } from "../data-populator";

import { Broker, MARKET_CLOSED_ERROR, QUANTITY_ERROR } from "./index";

const broker = new Broker();

const matchTickerToFakeMarket = (tickerToMatch: string) =>
	FAKE_MARKET.find(ticker => ticker.tickerSymbol === tickerToMatch);

const matchTickerToAssetsHeld = (tickerToMatch: string, arrayOfAssets: any[] & { tickerSymbol: string }[]) =>
	arrayOfAssets.find(ticker => ticker.tickerSymbol === tickerToMatch);

const moveRandomShareFromRewardsToTestAccount = async () => {

	const randomShare = getRandomItemFromArray(FAKE_MARKET);

	const testUser = await createTestUser(TEST_USER_EMAIL);
	const rewardsAccount = await createRewardsAccount({
		...FAKE_REWARDS_ACCOUNT,
		shares: [{ tickerSymbol: randomShare.tickerSymbol, quantity: 1 }]
	});

	const shareTransferResult = await broker
		.moveSharesFromRewardsAccount(TEST_USER_EMAIL, randomShare.tickerSymbol, 1);

	return { randomShare, testUser, rewardsAccount, shareTransferResult };
};

describe(`Test Emma-Broker module`, () => {

	it(`listTradableAssets() returns all tickers from fake market`, async () => {

		const tickers = await broker.listTradableAssets();

		tickers.forEach(tickerToCheck => expect(matchTickerToFakeMarket(tickerToCheck.tickerSymbol))
			.toBeDefined());

	});

	it(`getLatestPrice() returns latest price for ticker from the fake market `, async () => {

		const randomTickerToTest = getRandomItemFromArray(FAKE_MARKET);
		const { tickerSymbol, sharePrice: sharePriceToTest } = randomTickerToTest;

		const { sharePrice } = await broker.getLatestPrice(tickerSymbol);

		expect(sharePrice).toEqual(sharePriceToTest);
	});

	it(`isMarketOpen() returns expect market to be open, closing in 8 hours, and opening next day`, async () => {

		const marketStatus = await broker.isMarketOpen();

		const nextOpeningTime = DateTime.fromISO(marketStatus.nextOpeningTime);
		const nextClosingTime = DateTime.fromISO(marketStatus.nextClosingTime);

		expect(marketStatus.open).toBe(true);
		expect(nextOpeningTime.diff(DateTime.now(), "days").days).toBeCloseTo(-1);
		expect(nextClosingTime.diff(DateTime.now(), "hours").hours).toBeCloseTo(8);
	});

	it(`buySharesInRewardsAccount() returns {success: true, sharePrice: [correct price]}`, async () => {

		await createRewardsAccount();

		const tickerToBuy = getRandomItemFromArray(FAKE_MARKET);

		const result = await broker.buySharesInRewardsAccount(tickerToBuy.tickerSymbol, 1);

		expect(result.success).toBe(true);
		expect(result.sharePricePaid).toBe(tickerToBuy.sharePrice);
	});

	it(`buySharesInRewardsAccount() creates a buy transaction`, async () => {

		await createRewardsAccount();

		const tickerToBuy = getRandomItemFromArray(FAKE_MARKET);

		await broker.buySharesInRewardsAccount(tickerToBuy.tickerSymbol, 1);

		const transaction = await Transaction.findOne({ type: TRANSACTION_TYPES.BUY });

		expect(transaction).toBeDefined();

		expect(transaction!.fromAccount).toBe(FAKE_BROKER);
		expect(transaction!.toAccount).toBe(FAKE_REWARDS_ACCOUNT.email);
		expect(transaction!.unitPrice).toBe(tickerToBuy.sharePrice);
	});

	it(`buySharesInRewardsAccount() puts a share into rewards account`, async () => {

		await createRewardsAccount({ ...FAKE_REWARDS_ACCOUNT, shares: [] });

		const tickerToBuy = getRandomItemFromArray(FAKE_MARKET);

		await broker.buySharesInRewardsAccount(tickerToBuy.tickerSymbol, 1);

		const rewardAccount = await User.findOne({ email: FAKE_REWARDS_ACCOUNT.email });
		const sharesHeld = rewardAccount!.shares;

		expect(sharesHeld.length).toBe(1);
		expect(sharesHeld.at(0)!.tickerSymbol).toBe(tickerToBuy.tickerSymbol);
		expect(sharesHeld.at(0)!.quantity).toBe(1);
	});


	it(`buySharesInRewardsAccount() throws an error if quantity is negative or not an integer`, async () => {

		await expect(async () => await broker.buySharesInRewardsAccount("ANY", -1))
			.rejects
			.toThrowError(QUANTITY_ERROR);
	});

	it(`buySharesInRewardsAccount() throws an error if market is about to close`, async () => {

		const spy = jest.spyOn(broker, "isMarketOpen").mockResolvedValue({
			open: false,
			nextOpeningTime: DateTime.now().minus({ hour: 24 }).toISO(),
			nextClosingTime: DateTime.now().plus({ hour: 8 }).toISO()
		});

		await expect(async () => await broker.buySharesInRewardsAccount("ANY", 1))
			.rejects
			.toThrowError(MARKET_CLOSED_ERROR);

		spy.mockRestore();
	});

	it(`getRewardsAccountPositions() returns reward account positions`, async () => {

		await createRewardsAccount();

		const sharesHeld = await broker.getRewardsAccountPositions();

		sharesHeld.forEach(shareHeld =>
			expect(matchTickerToAssetsHeld(shareHeld.tickerSymbol, sharesHeld)).toBeDefined());
	});

	it(`moveSharesFromRewardsAccount() returns {success: true}`, async () => {

		const { shareTransferResult: result } = await moveRandomShareFromRewardsToTestAccount();

		expect(result.success).toBe(true);
	});

	it(`moveSharesFromRewardsAccount() creates valid transaction`, async () => {

		const { randomShare, testUser, rewardsAccount } = await moveRandomShareFromRewardsToTestAccount();

		const transaction = await Transaction.findOne({ type: TRANSACTION_TYPES.REFERRAL });

		expect(transaction).toBeDefined();

		expect(transaction!.fromAccount).toBe(rewardsAccount.email);
		expect(transaction!.toAccount).toBe(testUser.email);
		expect(transaction!.unitPrice).toBe(randomShare.sharePrice);
	});

	it(`moveSharesFromRewardsAccount() removes a share from reward account`, async () => {

		await moveRandomShareFromRewardsToTestAccount();

		const result = await broker.getRewardsAccountPositions();

		expect(result.length).toBe(0);
	});

	it(`moveSharesFromRewardsAccount() adds a share to user account`, async () => {

		const { randomShare } = await moveRandomShareFromRewardsToTestAccount();

		const result = await User.findOne({ email: TEST_USER_EMAIL });

		const sharesHeld = result!.shares!;

		expect(sharesHeld.length).toBe(1);
		expect(sharesHeld.at(0)!.tickerSymbol).toBe(randomShare.tickerSymbol);
		expect(sharesHeld.at(0)!.quantity).toBe(1);
	});
});

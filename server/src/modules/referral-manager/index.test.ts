import {
	TEST_CPA,
	TEST_CPA_MIN_SHARE_PRICE,
	TEST_USER_EMAIL,
	VALID_CHANCES_PAYLOAD
} from "../../test/constants";

import { createTestUser } from "../../test/helpers";
import { Transaction, TRANSACTION_TYPES } from "../../models/transaction";
import { User, UserAttributes } from "../../models/user";
import { createRewardsAccount } from "../data-populator";

import {
	awardReferralShare,
	awardShareToUserUsingCPA,
	awardShareToUserUsingPercentSettings,
	CPA_VALUE_ERROR,
	MIN_CPA_SHARE_PRICE_ERROR,
	REFERRAL_ALGORITHMS
} from "./index";

const setupTest = async () => {

	const testUser = await createTestUser(TEST_USER_EMAIL);
	const rewardsAccount = await createRewardsAccount();

	return { testUser, rewardsAccount };
};

const awardAmountOfSharesCPA = async (numberOfShares: number, user: UserAttributes,  CPA: number, minCpaSharePrice: number) => {
	for (let i = 0; i < numberOfShares; i++) {
		await awardShareToUserUsingCPA(user, CPA, minCpaSharePrice);
	}
};

describe(`Test referral-manager module`, () => {

	it(`awardShareToUserUsingPercentSettings() returns { outcome, shareAwarded }`, async () => {

		const { testUser } = await setupTest();

		const result = await awardShareToUserUsingPercentSettings(testUser, VALID_CHANCES_PAYLOAD);

		expect(result.outcome).toBeDefined();
		expect(result.shareAwarded).toBeDefined();
	});

	it(`awardShareToUserUsingPercentSettings() awards share in the correct price range`, async () => {

		const { testUser } = await setupTest();

		const result = await awardShareToUserUsingPercentSettings(testUser, VALID_CHANCES_PAYLOAD);

		const outcome = result.outcome;
		const shareAwarded = result.shareAwarded;
		const { min, max } = outcome.result;

		expect(shareAwarded.sharePrice).toBeGreaterThanOrEqual(min);
		expect(shareAwarded.sharePrice).toBeLessThanOrEqual(max);
	});

	it(`awardShareToUserUsingPercentSettings() puts a share into user's account`, async () => {

		const { testUser } = await setupTest();

		const awardResult = await awardShareToUserUsingPercentSettings(testUser, VALID_CHANCES_PAYLOAD);
		const updatedUser = await User.findOne({ email: testUser.email });

		const shareAwarded = awardResult.shareAwarded;
		const sharesHeld = updatedUser!.shares;

		expect(sharesHeld.length).toBe(1);
		expect(sharesHeld.at(0)!.tickerSymbol).toBe(shareAwarded.tickerSymbol);
		expect(sharesHeld.at(0)!.quantity).toBe(1);
	});

	it(`awardShareToUserUsingPercentSettings() awards shares in all allowed price ranges`, async () => {

		const numberOrPossibleRanges = VALID_CHANCES_PAYLOAD.length;
		const resultOutcomes: number[] = [];

		const { testUser } = await setupTest();

		while ([...new Set(resultOutcomes)].length !== numberOrPossibleRanges) {

			const awardResult = await awardShareToUserUsingPercentSettings(testUser, VALID_CHANCES_PAYLOAD);
			const { outcome, shareAwarded } = awardResult;

			resultOutcomes.push(outcome.chance);

			expect(shareAwarded.sharePrice).toBeGreaterThanOrEqual(outcome.result.min);
			expect(shareAwarded.sharePrice).toBeLessThanOrEqual(outcome.result.max);
		}
	});

	it(`awardShareToUserUsingCPA() returns { referralAggregation?, currentCpa, targetCpa, allowedMaxPrice, shareAwarded }`, async () => {

		const { testUser } = await setupTest();

		const transactions = await Transaction.find({});
		const result = await awardShareToUserUsingCPA(testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		//if no transactions present before award there's nothing to aggregate
		transactions.length > 0 && expect(result.referralAggregation).toBeDefined();

		expect(result.currentCpa).toBeDefined();
		expect(result.targetCpa).toBeDefined();
		expect(result.allowedMaxPrice).toBeDefined();
		expect(result.shareAwarded).toBeDefined();
	});

	it(`awardShareToUserUsingCPA() returns { referralAggregation!, currentCpa, targetCpa, allowedMaxPrice, shareAwarded }`, async () => {

		const { testUser } = await setupTest();

		await awardAmountOfSharesCPA(10, testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		const result = await awardShareToUserUsingCPA(testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		expect(result.referralAggregation).toBeDefined();
		expect(result.currentCpa).toBeDefined();
		expect(result.targetCpa).toBeDefined();
		expect(result.allowedMaxPrice).toBeDefined();
		expect(result.shareAwarded).toBeDefined();
	});

	it(`awardShareToUserUsingCPA() awards first share within the CPA target`, async () => {

		const { testUser } = await setupTest();

		const result = await awardShareToUserUsingCPA(testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		const { shareAwarded: { sharePrice } } = result;

		expect(sharePrice).toBeGreaterThanOrEqual(TEST_CPA_MIN_SHARE_PRICE);
		expect(sharePrice).toBeLessThanOrEqual(TEST_CPA);
	});

	it(`awardShareToUserUsingCPA() - actual CPA trends towards target CPA over 100+ awards`, async () => {

		const sharesToAward = 150;
		const acceptableCpaDeviationFromTarget = 5; //5%

		const { testUser } = await setupTest();

		await awardAmountOfSharesCPA(sharesToAward, testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		const result = await awardShareToUserUsingCPA(testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		const { currentCpa, targetCpa } = result;
		const cpaDeviationFromTarget = 100 - (currentCpa / targetCpa * 100);

		expect(cpaDeviationFromTarget).toBeLessThanOrEqual(acceptableCpaDeviationFromTarget);
	});

	it(`awardShareToUserUsingCPA() there should be shares awarded over CPA value`, async () => {

		const sharesToAward = 150;

		const { testUser } = await setupTest();

		await awardAmountOfSharesCPA(sharesToAward, testUser, TEST_CPA, TEST_CPA_MIN_SHARE_PRICE);

		const result = await Transaction.find({
			type: TRANSACTION_TYPES.REFERRAL,
			unitPrice: { $gt: TEST_CPA }
		});

		expect(result.length).toBeGreaterThan(0);
	});

	it(`awardShareToUserUsingCPA() throws error if CPA negative number`, async () => {

		const { testUser } = await setupTest();

		await expect(async () => await awardShareToUserUsingCPA(testUser, -TEST_CPA, TEST_CPA_MIN_SHARE_PRICE))
			.rejects
			.toThrowError(CPA_VALUE_ERROR);
	});

	it(`awardShareToUserUsingCPA() throws error if minCpaSharePrice negative number`, async () => {

		const { testUser } = await setupTest();

		await expect(async () => await awardShareToUserUsingCPA(testUser, TEST_CPA, -TEST_CPA_MIN_SHARE_PRICE))
			.rejects
			.toThrowError(MIN_CPA_SHARE_PRICE_ERROR);
	});

	it(`awardReferralShare() calls the awardShareToUserUsingCPA() if correct CPA values provided`, async () => {

		const { testUser } = await setupTest();

		const result = await awardReferralShare({
			user: testUser,
			CPA: TEST_CPA,
			chances: VALID_CHANCES_PAYLOAD,
			minCpaSharePrice: TEST_CPA_MIN_SHARE_PRICE
		});

		expect(result!.algorithm).toBe(REFERRAL_ALGORITHMS.CPA);
		expect(result!.shareAwarded).toBeDefined();
	});

	it(`awardReferralShare() calls the awardShareToUserUsingPercentSettings() if no CPA values provided`, async () => {

		const { testUser } = await setupTest();

		const result = await awardReferralShare({
			user: testUser,
			chances: VALID_CHANCES_PAYLOAD
		});

		expect(result!.algorithm).toBe(REFERRAL_ALGORITHMS.PERCENTAGE);
	});
});

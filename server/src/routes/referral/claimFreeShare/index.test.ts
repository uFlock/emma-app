import request from "supertest";

import { app } from '../../../app';
import { createRewardsAccount } from "../../../modules/data-populator";
import { REFERRAL_ALGORITHMS } from "../../../modules/referral-manager";
import * as env from "../../../modules/environment";
import { VALID_CPA_ENVIRONMENT_SETTINGS } from "../../../test/constants";

const ENDPOINT = `/claim-free-share`;

const VALID_DEFAULT_PAYLOAD = {
	email: "TEST_EMAIL@TEST.COM"
};

const INVALID_DEFAULT_PAYLOAD_WRONG_EMAIL_SCHEMA = {
	email: "TEST_EMAIL_AT_TEST.COM"
};

describe(`${ENDPOINT} route`, () => {

	it(`returns 200 when email schema matches`, async () => {

		await createRewardsAccount();

		await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);
	});

	it(`returns 400 if email is in invalid format`, async () => {

		await request(app)
			.post(ENDPOINT)
			.send(INVALID_DEFAULT_PAYLOAD_WRONG_EMAIL_SCHEMA)
			.expect(400);
	});

	it(`returns 400 if email has less than 10 characters`, async () => {

		await request(app)
			.post(ENDPOINT)
			.send({ ...VALID_DEFAULT_PAYLOAD, email: "he@bo.lb" })
			.expect(400);
	});

	it(`returns 400 if email has over 150 characters`, async () => {

		const LONG_EMAIL = "x".repeat(10) + "@" + "x".repeat(137) + ".gb";

		await request(app)
			.post(ENDPOINT)
			.send({ ...VALID_DEFAULT_PAYLOAD, email: LONG_EMAIL })
			.expect(400);
	});

	it(`returns 400 if email is valid but additional props passed`, async () => {

		const EXTRA_PAYLOAD = { extraProp: "I SHOULD NOT BE HERE", ...VALID_DEFAULT_PAYLOAD };

		await request(app)
			.post(ENDPOINT)
			.send(EXTRA_PAYLOAD)
			.expect(400);
	});

	it(`returns 200 and gets/creates a user with provided email and returns user within the details block`, async () => {

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { details: { user } } = result.body;

		expect(user).toBeDefined();
		expect(user.email).toBe(VALID_DEFAULT_PAYLOAD.email);
	});

	it(`returns 200 and { algorithm, shareAwarded, details }`, async () => {

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { algorithm, shareAwarded, details } = result.body;

		expect(algorithm).toBeDefined();
		expect(shareAwarded).toBeDefined();
		expect(details).toBeDefined();
	});

	it(`returns 200 and awards share using percentage algorithm if no CPA values in environment`, async () => {

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { algorithm, shareAwarded } = result.body;

		expect(algorithm).toBe(REFERRAL_ALGORITHMS.PERCENTAGE);
		expect(shareAwarded).toBeDefined();
	});

	it(`returns 200 and awards share using percentage algorithm, and offers details { user, outcome }`, async () => {

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { algorithm, shareAwarded, details: { outcome, user } } = result.body;

		expect(algorithm).toBe(REFERRAL_ALGORITHMS.PERCENTAGE);
		expect(shareAwarded).toBeDefined();
		expect(outcome).toBeDefined();
		expect(user).toBeDefined();
	});

	it(`returns 200 and awards share using CPA algorithm if CPA values in environment`, async () => {

		const spy = jest.spyOn(env, "getReferralsConfig").mockReturnValue(VALID_CPA_ENVIRONMENT_SETTINGS);

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { algorithm, shareAwarded } = result.body;

		expect(algorithm).toBe(REFERRAL_ALGORITHMS.CPA);
		expect(shareAwarded).toBeDefined();

		spy.mockRestore();
	});

	it(`returns 200 and awards share using CPA algorithm, and offers details { user, referralAggregation?, currentCpa, targetCpa, allowedMaxPrice }`, async () => {

		const spy = jest.spyOn(env, "getReferralsConfig").mockReturnValue(VALID_CPA_ENVIRONMENT_SETTINGS);

		await createRewardsAccount();

		const result = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const {
			algorithm,
			shareAwarded,
			details: { user, currentCpa, targetCpa, allowedMaxPrice, referralAggregation }
		} = result.body;

		expect(algorithm).toBe(REFERRAL_ALGORITHMS.CPA);
		expect(shareAwarded).toBeDefined();
		expect(user).toBeDefined();
		expect(currentCpa).toBeDefined();
		expect(targetCpa).toBeDefined();
		expect(allowedMaxPrice).toBeDefined();

		expect(referralAggregation).toBeUndefined(); //if it's the very first award there will be nothing to aggregate yet

		spy.mockRestore();
	});

	it(`returns 200 and details: { referralAggregation! } is defined after second award of share using CPA algorithm`, async () => {

		const spy = jest.spyOn(env, "getReferralsConfig").mockReturnValue(VALID_CPA_ENVIRONMENT_SETTINGS);

		await createRewardsAccount();

		const firstAward = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const secondAward = await request(app)
			.post(ENDPOINT)
			.send(VALID_DEFAULT_PAYLOAD)
			.expect(200);

		const { details: { referralAggregation: firstReferralAggregation } } = firstAward.body;
		const { details: { referralAggregation: secondReferralAggregation } } = secondAward.body;

		expect(firstReferralAggregation).toBeUndefined();
		expect(secondReferralAggregation).toBeDefined();

		spy.mockRestore();
	});
});

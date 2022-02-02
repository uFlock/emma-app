import request from "supertest";

import { app } from '../../../app';
import { createRewardsAccount } from "../../../modules/data-populator";

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

	it(`returns 400 if email is valid but additional props passed`, async () => {

		const EXTRA_PAYLOAD = { extraProp: "I SHOULD NOT BE HERE", ...VALID_DEFAULT_PAYLOAD };

		await request(app)
			.post(ENDPOINT)
			.send(EXTRA_PAYLOAD)
			.expect(400);
	});
});

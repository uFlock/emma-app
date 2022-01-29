import request from "supertest";

import { app } from '../../app';

const ENDPOINT = `/alive`;

describe(`${ENDPOINT} route`, () => {

	const expectedReturnPayload = "It Lives";

	it(`returns 200 and "${expectedReturnPayload}" when server is running`, async () => {

		const response = await request(app)
			.get(ENDPOINT)
			.expect(200);

		expect(response.text).toEqual(expectedReturnPayload);
	});
});

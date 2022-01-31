import request from "supertest";

import { app } from '../../app';

const ALIVE_ENDPOINT = `/alive`;
const NON_EXISTENT_ENDPOINT = `/NON_EXISTENT_ENDPOINT`;

describe(`misc routes`, () => {

	const expectedReturnPayload = "It Lives";

	it(`returns 200 and "${expectedReturnPayload}" when server is running`, async () => {

		const response = await request(app)
			.get(ALIVE_ENDPOINT)
			.expect(200);

		expect(response.text).toEqual(expectedReturnPayload);
	});

	it(`returns 404 when navigating to non-existent route`, async () => {

		await request(app)
			.get(NON_EXISTENT_ENDPOINT)
			.expect(404);
	});
});

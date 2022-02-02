import { Express } from 'express';

import createCors from "cors";
import bodyParser from "body-parser";

import { getCorsPolicy } from "../modules/environment";

import { errorHandler } from "./error-handler";

export { errorHandler } from './error-handler';
export { validateBody } from './json-validator';
export { validateRequest } from './validate-request';

export function setupCors(app: Express) {

	const corsPolicy = getCorsPolicy();

	const corsMiddleware = createCors({
		origin: corsPolicy.allowOrigin,
		credentials: true
	});

	app.use(corsMiddleware);
}

export function setupBodyParser(app: Express) {
	app.use(bodyParser.json());
}

export function setupErrorHandler(app: Express) {
	app.use(errorHandler);
}

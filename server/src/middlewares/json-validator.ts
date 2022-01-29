import Ajv, { Schema } from "ajv";
import { NextFunction, Response, Request } from "express";

import addFormats from "ajv-formats";
import addErrors from "ajv-errors";

import { SchemaValidationError } from "../errors/schema-validation-error";

export const validateBody = (schema: Schema) => (
	req: Request,
	res: Response,
	next: NextFunction
) => {

	const ajv = new Ajv({ allErrors: true });

	addFormats(ajv);
	addErrors(ajv);

	const validate = ajv.compile(schema);
	const valid = validate(req.body);

	if (!valid && validate.errors) {
		throw new SchemaValidationError(validate.errors);
	}

	return next();
};

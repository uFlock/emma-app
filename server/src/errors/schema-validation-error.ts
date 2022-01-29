import { CustomError } from "./custom-error";
import { ErrorObject } from "ajv";

export class SchemaValidationError extends CustomError {

	statusCode = 400;

	constructor(public errors: ErrorObject[]) {

		super("Invalid request parameters");

		Object.setPrototypeOf(this, SchemaValidationError.prototype);
	}

	toApiErrors() {
		return this.errors.map((error) => {

			const message = error.message!;
			const pathArray = error.instancePath.split('/');
			const pathArrayIndex = pathArray.length - 1;
			const parameter = pathArray[pathArrayIndex];
			const fullMessage = `${parameter} ${message}`;

			return {
				message,
				parameter,
				fullMessage,
				additionalInformation: error,
			};
		});
	}
}

import { CustomError } from "./custom-error";

export class DatabaseConnectionError extends CustomError {

	statusCode = 500;
	message = "Error connecting to database";

	constructor() {
		super("Error connecting to database");
		Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
	}

	toApiErrors() {
		return [{ message: this.message }];
	}
}

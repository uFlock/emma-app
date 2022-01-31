import { Schema } from 'ajv';

export const schema: Schema = {
	type: "object",
	required: ["email"],
	allOf: [
		{
			properties: {
				email: { type: "string", format: "email", minLength: 5, maxLength: 150 },
			},
			additionalProperties: false,
		},
	],
};
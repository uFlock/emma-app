import { ChanceSettings } from "../modules/chance-calculator";

export const LONG_TEST_TIMEOUT_1_MINUTE = 60000;

export const TEST_USER_EMAIL = "test@email.com";

export const TEST_CPA = 50;
export const TEST_CPA_MIN_SHARE_PRICE = 3;

export const VALID_CHANCES_PAYLOAD: ChanceSettings[] = [
	{
		chance: 95,
		result: { min: 3, max: 10 }
	},
	{
		chance: 3,
		result: { min: 10, max: 25 }
	},
	{
		chance: 2,
		result: { min: 25, max: 200 }
	},
];

export const INVALID_CHANCES_PAYLOAD_NOT_100: ChanceSettings[] = [
	{
		chance: 94,
		result: { min: 3, max: 10 }
	},
	{
		chance: 3,
		result: { min: 10, max: 25 }
	},
	{
		chance: 2,
		result: { min: 25, max: 200 }
	},
];

export const INVALID_CHANCES_PAYLOAD_LOW_PRICE_RANGE: ChanceSettings[] = [
	{
		chance: 95,
		result: { min: 0.0001, max: 0.0002 }
	},
	{
		chance: 3,
		result: { min: 0.0001, max: 0.0002 }
	},
	{
		chance: 2,
		result: { min: 0.0001, max: 0.0002 }
	},
];
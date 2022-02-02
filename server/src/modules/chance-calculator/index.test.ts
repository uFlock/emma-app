import { calculateOutcome, ChanceSettings, CHANCES_DO_NOT_ADD_UP_ERROR } from "./index";

const VALID_PAYLOAD: ChanceSettings[] = [
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

const INVALID_PAYLOAD: ChanceSettings[] = [
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


describe(`test chance calculation`, () => {


	it(`returns roughly uniform distribution of chances across 1 million simulations`, async () => {

		const chanceDistribution: { [index: string]: any } = {};

		//simulate chance n times
		for (let i = 0; i < 1000000; i++) {

			const result = calculateOutcome(VALID_PAYLOAD);

			chanceDistribution[result.chance] = chanceDistribution[result.chance] ?
				chanceDistribution[result.chance] + 1 :
				1;
		}

		//check chance distribution
		VALID_PAYLOAD.forEach(chanceSetting => {

			const normalisedChanceDistributionOutcome = chanceDistribution[chanceSetting.chance] / 10000;

			expect(chanceSetting.chance)
				.toBeCloseTo(normalisedChanceDistributionOutcome, 1);

		});

		console.log("Chance Distribution: ", chanceDistribution);
	});

	it(`throws and error if all chances don't add up to 100`, () =>
		expect(() => calculateOutcome(INVALID_PAYLOAD))
			.toThrow(CHANCES_DO_NOT_ADD_UP_ERROR)
	);
});

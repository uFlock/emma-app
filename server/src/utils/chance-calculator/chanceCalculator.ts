export interface ChanceSettings {
	chance: number,
	result: {
		min: number,
		max: number
	}
}

export const CHANCES_DO_NOT_ADD_UP_ERROR = "Sum of chances must add up to 100%";

//not purely random - but random enough for the task
export const calculateOutcome = (payload: ChanceSettings[]): ChanceSettings => {

	checkAllChancesAddUpTo100(payload);

	const diceResult = Math.random() * 100;

	let startCheckRange = 0;

	const result = payload.find(possibleOutcome => {

		if (diceResult >= startCheckRange && diceResult <= startCheckRange + possibleOutcome.chance) {
			return possibleOutcome.result;
		}

		startCheckRange += possibleOutcome.chance;
	});

	return result!;
};

export const checkAllChancesAddUpTo100 = (payload: ChanceSettings[]) => {

	let totalPercent = 0;

	payload.forEach(setting => totalPercent += setting.chance);

	if (totalPercent !== 100) throw new Error(CHANCES_DO_NOT_ADD_UP_ERROR);
};
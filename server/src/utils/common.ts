export const toFloat = (number: number, decimalPoints = 2) =>
	parseFloat(number.toFixed(decimalPoints));

export const getRandomItemFromArray = (array: any[]) => {

	const arrayLength = array.length;
	const randomIndex = getRandomInt(arrayLength);

	return arrayLength > 0 ? array[randomIndex] : null;
};

export const getRandomInt = (max: number) => Math.floor(Math.random() * max);
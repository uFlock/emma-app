import faker from "faker";

import { User, UserAttributes } from "../models/user";

const fakeRewardAccountPositions = [
	{ tickerSymbol: "AABZZ", quantity: 4, sharePrice: 5, },
	{ tickerSymbol: "ABCZZ", quantity: 7, sharePrice: 15, },
	{ tickerSymbol: "ACBZZ", quantity: 10, sharePrice: 100, }
];

export const FAKE_EMAIL_DOMAIN = "fake-example.con";
export const FAKE_REWARDS_ACCOUNT: UserAttributes = {
	name: "REWARDS_ACCOUNT",
	email: `REWARDS_ACCOUNT@${FAKE_EMAIL_DOMAIN}`,
	shareClaimed: true,
	shares: fakeRewardAccountPositions
};

export const generateUsers = (numberOfUsers: number = 100) => {

	const generatedUsers: UserAttributes[] = [];

	for (let i = 0; i < numberOfUsers; i++) {

		const firstName = faker.name.firstName();
		const lastName = faker.name.lastName();
		const randomNumber = faker.datatype.number(100);
		const name = `${firstName} ${lastName}`;
		const email = `${firstName}.${lastName}${randomNumber}@${FAKE_EMAIL_DOMAIN}`;

		generatedUsers.push({
			name,
			email,
			shareClaimed: false,
			shares: []
		});
	}

	return generatedUsers;
};

export const insertUsersIntoDB = async (usersToInsert: UserAttributes[] = [], clearExisting: boolean = true) => {

	//clear existing users
	clearExisting && await User.deleteMany({});

	for (let userToInsert of usersToInsert) {
		await User
			.build(userToInsert)
			.save();
	}

	return User.find({});
};

export const populateUsers = async (numberOfUsers: number = 100, clearExisting: boolean = true) => {

	const usersToInsert = generateUsers(numberOfUsers);

	return insertUsersIntoDB(usersToInsert, clearExisting);
};

export const createRewardsAccount = async (clearExisting: boolean = true) => {
	return insertUsersIntoDB([FAKE_REWARDS_ACCOUNT], clearExisting);
};

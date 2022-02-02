import faker from "faker";

import { FAKE_EMAIL_DOMAIN, FAKE_REWARDS_ACCOUNT } from "../../constants";
import { User, UserAttributes } from "../../models/user";
import { Transaction } from "../../models/transaction";

export const generateUsers = (numberOfUsers: number = 100) => {

	const generatedUsers: UserAttributes[] = [];

	for (let i = 0; i < numberOfUsers; i++) {

		const generatedUser = generateUser();

		generatedUsers.push(generatedUser);
	}

	return generatedUsers;
};

export function generateUser(emailToUse?: string) {

	const firstName = faker.name.firstName();
	const lastName = faker.name.lastName();
	const randomNumber = faker.datatype.number(100);
	const name = `${firstName} ${lastName}`;
	const email = emailToUse || `${firstName}.${lastName}${randomNumber}@${FAKE_EMAIL_DOMAIN}`;

	return {
		name,
		email,
		shareClaimed: false,
		shares: []
	};
}

export const insertUsersIntoDB = async (usersToInsert: UserAttributes[] = [], clearExisting: boolean = true) => {

	//clear existing users
	clearExisting && await User.deleteMany({});

	for (let userToInsert of usersToInsert) {
		await insertUserIntoDB(userToInsert);
	}

	return User.find({});
};

export const insertUserIntoDB = async (userToInsert: UserAttributes) => await User
	.build(userToInsert)
	.save();

export const populateUsers = async (numberOfUsers: number = 100, clearExisting: boolean = true) => {

	const usersToInsert = generateUsers(numberOfUsers);

	return insertUsersIntoDB(usersToInsert, clearExisting);
};

export const createRewardsAccount = async (fakeRewardsAccount?: UserAttributes) =>
	insertUserIntoDB(fakeRewardsAccount || FAKE_REWARDS_ACCOUNT);

export const emptyDB = async () => {

	console.log("Clearing DB Data...");

	await User.deleteMany({});
	await Transaction.deleteMany({});

	console.log("Data Deleted...");
};

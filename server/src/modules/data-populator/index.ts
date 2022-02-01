import faker from "faker";

import { User, UserAttributes } from "../../models/user";
import { FAKE_EMAIL_DOMAIN, FAKE_REWARDS_ACCOUNT } from "../../constants";

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

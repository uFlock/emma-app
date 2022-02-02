import { generateUser, insertUserIntoDB, insertUsersIntoDB } from "../modules/data-populator";

export const createTestUser = async (emailToUse?: string) => {

	const testUser = generateUser(emailToUse);

	return await insertUserIntoDB(testUser);
};

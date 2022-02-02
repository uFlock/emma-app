import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongo = new MongoMemoryServer();

beforeAll(async () => {

	const mongo = await MongoMemoryServer.create();
	const mongoUri = mongo.getUri();

	await mongoose.connect(mongoUri);
});

// clear data before each test
beforeEach(async () => {

	const collections = await mongoose.connection.db.collections();

	for (let collection of collections) {
		await collection.deleteMany({});
	}
});

afterAll(async () => {
	await mongoose.connection.close();
	await mongo.stop();
});

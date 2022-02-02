import http from "http";
import mongoose, { Mongoose } from "mongoose";

import { app } from "./app";
import { getMongoConfig, getServerConfig, validateEnvironment } from "./modules/environment";
import { createRewardsAccount, emptyDB } from "./modules/data-populator";

validateEnvironment();

const MONGO_CONFIG = getMongoConfig();
const SERVER_CONFIG = getServerConfig();

//no catching as need it to crash in case of error
startServer().then(() => console.log('Ready to go captain!'));

async function startServer(): Promise<void> {

	try {

		await connectToMongo();
		await emptyDB(); //clear database on restart
		await createRewardsAccount();

		const server = app.listen(SERVER_CONFIG);

		// intercept termination requests and terminate gracefully
		process.on("SIGINT", () => handleTermination(server, mongoose));
		process.on("SIGTERM", () => handleTermination(server, mongoose));

		console.log(`API Server: listening on port ${SERVER_CONFIG.port}`);

	} catch (error) {
		throw new Error(error as string);
	}
}

async function connectToMongo() {

	console.log('Connecting to mongo-db');

	await mongoose.connect(MONGO_CONFIG.uri);

	console.log('Connected to mongo-db');
}

const handleTermination = async (server: http.Server, mongoose: Mongoose) => {
	await httpServerClose(server);
	await mongoose.disconnect();
};

const httpServerClose = async (server: http.Server): Promise<boolean> =>
	new Promise((resolve: (result: boolean) => void) =>
		server.close(() => resolve(true)));

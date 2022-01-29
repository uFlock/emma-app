"use strict"

export const getServerConfig = () => environment.server;
export const getCorsPolicy = () => environment.corsPolicy;
export const getMongoConfig = () => environment.mongo;

const requiredEnvVariables = [
	'ALLOW_CORS_ORIGIN',
	'MONGO_URI',
	'PORT'
];

export const validateEnvironment = () => requiredEnvVariables
	.forEach(variable => validateEnvVariable(variable));

interface EnvironmentVariables {
	server: {
		port: number;
	}
	mongo: {
		uri: string,
	}
	corsPolicy: {
		allowOrigin: string
	},
}

const environment: EnvironmentVariables = {
	server: {
		port: (process.env.PORT as unknown as number | undefined) || 3000
	},
	mongo: {
		uri: process.env.MONGO_URI || 'mongodb://mongo-db:27017',
	},
	corsPolicy: {
		allowOrigin: process.env.ALLOW_CORS_ORIGIN || 'http://localhost:8080'
	}
};

function validateEnvVariable(envVariableName: string) {

	if (!process.env[envVariableName]) {
		throwEnvError(envVariableName);
	}
}

function throwEnvError(envVariableName: string) {
	throw new Error(`${envVariableName} - environmental variable must be set`);
}

"use strict";

import { ChanceSettings } from "../../utils/chance-calculator";

export const getServerConfig = () => environment.server;
export const getCorsPolicy = () => environment.corsPolicy;
export const getMongoConfig = () => environment.mongo;
export const getReferralsConfig = () => environment.referrals;

const requiredEnvVariables = [
	'ALLOW_CORS_ORIGIN',
	'MONGO_URI',
	'PORT',

	'CHANCE1',
	'MIN1',
	'MAX1',

	'CHANCE2',
	'MIN2',
	'MAX2',

	'CHANCE3',
	'MIN3',
	'MAX3',
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
	referrals: {
		chances: ChanceSettings[]
	}
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
	},
	referrals: {
		chances: [
			{
				chance: +process.env.CHANCE1!,
				result: {
					min: +process.env.MIN1!,
					max: +process.env.MAX1!
				}
			},
			{
				chance: +process.env.CHANCE2!,
				result: {
					min: +process.env.MIN2!,
					max: +process.env.MAX2!
				}
			},
			{
				chance: +process.env.CHANCE3!,
				result: {
					min: +process.env.MIN3!,
					max: +process.env.MAX3!
				}
			},
		]
	}
};

function validateEnvVariable(envVariableName: string) {
	if (!process.env[envVariableName]) throwEnvError(envVariableName);
}

function throwEnvError(envVariableName: string) {
	throw new Error(`${envVariableName} - environmental variable must be set`);
}

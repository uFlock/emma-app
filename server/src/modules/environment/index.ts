"use strict";

import { ChanceSettings } from "../chance-calculator";

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

export interface ServerEnv {
	port: number
}

export interface MongoEnv {
	uri: string
}

export interface CorsEnv {
	allowOrigin: string
}

export interface ReferralsEnv {
	chances: ChanceSettings[];
	cpa: {
		value: number
		minCpaSharePrice: number
	};
}

export const getServerConfig = (): ServerEnv => ({
	port: (process.env.PORT as unknown as number | undefined) || 3000
});

export const getCorsPolicy = (): CorsEnv => ({
	allowOrigin: process.env.ALLOW_CORS_ORIGIN || 'http://localhost:8080'
});

export const getMongoConfig = (): MongoEnv => ({
	uri: process.env.MONGO_URI || 'mongodb://mongo-db:27017',
});

export const getReferralsConfig = (): ReferralsEnv => ({
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
	],
	cpa: {
		value: +(process.env.CPA || 0),
		minCpaSharePrice: +(process.env.MIN_CPA_SHARE_COST || 3),
	}
});


export const validateEnvironment = () => requiredEnvVariables
	.forEach(variable => validateEnvVariable(variable));

function validateEnvVariable(envVariableName: string) {
	if (!process.env[envVariableName]) throwEnvError(envVariableName);
}

function throwEnvError(envVariableName: string) {
	throw new Error(`${envVariableName} - environmental variable must be set`);
}

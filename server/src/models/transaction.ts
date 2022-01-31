import mongoose, { Schema, Model, Document } from "mongoose";

import { applyIdTransform } from "./utils/formatDocId";

export enum TRANSACTION_TYPES {
	"SELL" = "SELL",
	"BUY" = "BUY",
	"REFERRAL" = "REFERRAL"
}

export interface TransactionAttributes {
	type: TRANSACTION_TYPES
	tickerSymbol: string
	fromAccount: string
	toAccount: string
	quantity: number
	unitPrice: number
	totalValue: number
}

export interface TransactionDocument extends TransactionAttributes, Document {}

interface TransactionModel extends Model<TransactionDocument> {
	build(attributes: TransactionAttributes): TransactionDocument;
}

const transform = (doc: any, ret: any) => applyIdTransform(ret);

const TransactionSchema: Schema = new Schema(
	{
		type: { type: String, required: true, enum: ['SELL', 'BUY', 'REFERRAL'] },
		tickerSymbol: { type: String, required: true },
		fromAccount: { type: String, required: true },
		toAccount: { type: String, required: true },
		quantity: { type: Number, required: true },
		unitPrice: { type: Number, required: true },
		totalValue: { type: Number, required: true },
	},
	{
		toObject: {
			transform,
			versionKey: false,
		},
		toJSON: {
			transform,
			versionKey: false,
		},
	}
);

const Transaction = mongoose.model<TransactionDocument, TransactionModel>("Transaction", TransactionSchema);

Transaction.build = (attributes: TransactionAttributes) => new Transaction(attributes);

export { Transaction } ;

import mongoose, { Schema, Model, Document } from "mongoose";

import { applyIdTransform } from "./utils/formatDocId";
import { AvailableRewardAsset } from "../modules/emma-broker";

export interface UserAttributes {
	email: string;
	name: string;
	shareClaimed: boolean,
	shares: AvailableRewardAsset[],
}

export interface UserDocument extends UserAttributes, Document {}

interface UserModel extends Model<UserDocument> {
	build(attributes: UserAttributes): UserDocument;
}

const transform = (doc: any, ret: any) => applyIdTransform(ret);

const UserSchema: Schema = new Schema(
	{
		email: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		shares: {type: [Object], required: true, default: []},
		shareClaimed: { type: Boolean, required: true, default: false },
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

const User = mongoose.model<UserDocument, UserModel>("User", UserSchema);

User.build = (attributes: UserAttributes) => new User(attributes);

export { User } ;

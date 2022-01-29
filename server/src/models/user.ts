import mongoose, { Schema, Model, Document } from "mongoose";

import { applyIdTransform } from "../utils/formatDocId";

export interface UserAttributes {
	email: string;
	name: string;
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

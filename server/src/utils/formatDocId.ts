export const applyIdTransform = (ret: any) => {

	const { _id, ...rest } = ret;

	return {
		id: ret._id,
		...rest,
	};
};

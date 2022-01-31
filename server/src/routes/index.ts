import { Router } from "express";

import { setMiscRoutes } from "./misc";
import { setReferralRoutes } from "./referral";

export const setAppRoutes = (router: Router) => {
	setReferralRoutes(router);
	setMiscRoutes(router);
};

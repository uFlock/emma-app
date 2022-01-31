import { Router } from "express";

import { claimFreeShare } from './claimFreeShare';

export const setReferralRoutes = (router: Router) => {
	claimFreeShare(router);
};
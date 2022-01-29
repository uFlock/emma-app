import express, { Router } from "express";
import "express-async-errors";

import { setAppRoutes } from './routes';

import {
	setupBodyParser,
	setupCors,
	setupErrorHandler,
} from "./middlewares";

const app = express();
const appRouter = Router();

setupBodyParser(app);
setupCors(app);

setAppRoutes(appRouter);

app.use(appRouter);

setupErrorHandler(app);

export { app };

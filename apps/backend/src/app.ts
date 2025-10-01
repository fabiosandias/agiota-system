import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import swaggerUi from 'swagger-ui-express';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiSpec } from './config/swagger.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiSpec));
app.use('/api', router);

app.use(errorHandler);

export { app };

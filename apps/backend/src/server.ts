import { app } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const port = env.PORT ?? 3333;

  app.listen(port, () => {
    console.log(`🚀 Backend ready on port ${port}`);
  });
};

void start();

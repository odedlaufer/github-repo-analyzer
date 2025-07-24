import './config/env.js';
import app from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server listening on https://localhost:${PORT}`);
});

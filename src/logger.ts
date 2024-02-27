import pino from 'pino';
import PinoPretty from 'pino-pretty';

const logger = pino(PinoPretty({ colorize: true, sync: true }));

export default logger;

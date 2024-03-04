import winston, { createLogger, format, transports } from "winston";
const { combine, timestamp, label, prettyPrint, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "right meow!" }), timestamp(), prettyPrint()),
  transports: [new transports.Console()],
});

logger.log({
  level: "info",
  message: "What time is the testing at?",
});

export default logger;

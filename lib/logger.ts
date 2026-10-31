export const logger = {
  debug(message: string, context?: Record<string, string | number>) {
    if (process.env.NODE_ENV === "development") console.debug(message, context);
  },
  info(message: string, context?: Record<string, string | number>) {
    console.info(message, context);
  },
  warn(message: string, context?: Record<string, string | number>) {
    console.warn(message, context);
  },
  error(message: string, context?: Record<string, string | number>) {
    console.error(message, context);
  },
};

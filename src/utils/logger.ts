/**
 * Logger wrapper that preserves existing call sites
 * Uses console.* in __DEV__, no-ops in production
 */

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
  log: (...args: any[]) => { 
    if (isDev) console.log(...args); 
  },
  info: (...args: any[]) => { 
    if (isDev) console.info(...args); 
  },
  warn: (...args: any[]) => { 
    if (isDev) console.warn(...args); 
  },
  error: (...args: any[]) => { 
    if (isDev) console.error(...args); 
  },
  debug: (...args: any[]) => { 
    if (isDev) console.debug(...args); 
  }
};

// Export individual methods for direct usage
export const log = logger.log;
export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;
export const debug = logger.debug;

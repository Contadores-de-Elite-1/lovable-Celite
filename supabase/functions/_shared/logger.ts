// Modulo de logging estruturado para Edge Functions
// Separa logs de desenvolvimento vs producao

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

// Detecta se esta em modo de desenvolvimento
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                      Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

/**
 * Loga mensagem estruturada
 * 
 * Em desenvolvimento: mostra todos os niveis (debug, info, warn, error)
 * Em producao: mostra apenas warn e error
 * 
 * @param level Nivel de log (debug | info | warn | error)
 * @param message Mensagem descritiva
 * @param context Objeto com dados adicionais
 */
export function log(level: LogLevel, message: string, context?: LogContext): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context })
  };
  
  // Em desenvolvimento: mostra tudo
  if (isDevelopment) {
    console.log(JSON.stringify(logEntry));
    return;
  }
  
  // Em producao: apenas warn e error
  if (level === 'warn' || level === 'error') {
    console.log(JSON.stringify(logEntry));
    
    // TODO: Integrar com Sentry para erros criticos
    if (level === 'error') {
      // Sentry.captureException(new Error(message), {
      //   extra: context
      // });
    }
  }
}

/**
 * Helper: Log de debug (apenas desenvolvimento)
 */
export function logDebug(message: string, context?: LogContext): void {
  log('debug', message, context);
}

/**
 * Helper: Log de info (apenas desenvolvimento)
 */
export function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}

/**
 * Helper: Log de warning (dev e prod)
 */
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

/**
 * Helper: Log de erro (dev e prod)
 */
export function logError(message: string, context?: LogContext): void {
  log('error', message, context);
}

/**
 * Helper: Log de erro com Exception
 */
export function logException(message: string, error: Error, context?: LogContext): void {
  logError(message, {
    ...context,
    error_message: error.message,
    error_stack: error.stack
  });
}


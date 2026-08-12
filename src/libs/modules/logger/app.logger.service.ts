import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

interface LogInfo {
  level: string;
  message: unknown;
  context?: string;
  stack?: string;
  [key: string]: unknown;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf((info: LogInfo) => {
          const timestamp = new Date().toISOString();
          const level = info.level;
          const context = info.context;
          const msg =
            info.message instanceof Error
              ? info.message.message
              : String(info.message);
          const stack = info.stack;
          const extra = Object.keys(info)
            .filter(
              (k) =>
                !['timestamp', 'level', 'message', 'stack', 'context'].includes(
                  k,
                ),
            )
            .map((k) => `${k}: ${JSON.stringify(info[k])}`)
            .join(' ');

          return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${msg}${stack ? `\n${stack}` : ''}${extra ? ' ' + extra : ''}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    const { context, messages } = this.extractContext(optionalParams);
    // Suppress internal NestJS logs that are too verbose during startup
    const internalContexts = [
      'RoutesResolver',
      'RouterExplorer',
      'InstanceLoader',
      'NestFactory',
    ];
    if (context && internalContexts.includes(context)) {
      return;
    }
    this.logger.info(String(message), { context, ...messages });
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    const { context, messages } = this.extractContext(optionalParams);

    // If the input message is an Error, use it directly
    if (message instanceof Error) {
      this.logger.error(message.message, {
        context,
        stack: message.stack,
        ...messages,
      });
      return;
    }

    // Extract trace from messages if available
    let trace: string | undefined;
    const ctx = context;

    if (messages.length > 0) {
      const firstMessage = messages[0];
      if (typeof firstMessage === 'string') {
        trace = firstMessage;
      }
    }

    this.logger.error(String(message), {
      context: ctx,
      stack: trace,
      ...messages,
    });
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    const { context, messages } = this.extractContext(optionalParams);
    this.logger.warn(String(message), { context, ...messages });
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    const { context, messages } = this.extractContext(optionalParams);
    this.logger.debug(String(message), { context, ...messages });
  }

  verbose?(message: unknown, ...optionalParams: unknown[]) {
    const { context, messages } = this.extractContext(optionalParams);
    this.logger.verbose(String(message), { context, ...messages });
  }

  private extractContext(params: unknown[]): {
    context: string | undefined;
    messages: unknown[];
  } {
    if (params.length === 0) {
      return { context: undefined, messages: [] };
    }

    const last = params[params.length - 1];
    if (typeof last === 'string') {
      return {
        context: last,
        messages: params.slice(0, params.length - 1),
      };
    }

    return { context: undefined, messages: params };
  }
}

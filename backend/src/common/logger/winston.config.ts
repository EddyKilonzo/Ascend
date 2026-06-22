import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export function createWinstonConfig(): winston.LoggerOptions {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    transports: [
      new winston.transports.Console({
        format: isProd
          ? winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike('Ascend', {
                colors: true,
                prettyPrint: true,
              }),
            ),
      }),
      ...(isProd
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 10 * 1024 * 1024,
              maxFiles: 5,
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 10 * 1024 * 1024,
              maxFiles: 10,
            }),
          ]
        : []),
    ],
  };
}

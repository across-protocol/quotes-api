import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === "development"
        ? ["log", "fatal", "error", "warn", "debug", "verbose"]
        : ["log", "fatal", "error", "warn"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT");

  app.enableVersioning();
  await app.listen(port);

  const logger = new Logger("bootstrap");
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

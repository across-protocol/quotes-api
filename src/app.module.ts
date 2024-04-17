import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FeesModule } from "./fees/fees.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    FeesModule,
  ],
})
export class AppModule {}

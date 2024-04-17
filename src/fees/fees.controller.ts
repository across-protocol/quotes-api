import { Controller, Get, Version } from "@nestjs/common";

@Controller("fees")
export class FeesController {
  @Version("1")
  @Get()
  getFees(): string {
    return "fees";
  }
}

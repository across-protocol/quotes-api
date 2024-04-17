import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { FeesModule } from "./../src/fees/fees.module";

describe("Fees (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FeesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning();
    await app.init();
  });

  it("/v1/fees (GET)", () => {
    return request(app.getHttpServer())
      .get("/v1/fees")
      .expect(200)
      .expect("fees");
  });

  afterAll(async () => {
    await app.close();
  });
});

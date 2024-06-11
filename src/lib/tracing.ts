import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export function initTracing() {
  const provider = new NodeTracerProvider();
  provider.register();

  registerInstrumentations({
    instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
  });
}

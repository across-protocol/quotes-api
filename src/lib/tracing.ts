import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";

export function initTracing() {
  const provider = new NodeTracerProvider();
  const exporter = new TraceExporter();

  provider.register();
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook(req) {
          if (req.url.match("/health")) {
            return true;
          }
          return false;
        },
      }),
      new ExpressInstrumentation(),
    ],
  });
}

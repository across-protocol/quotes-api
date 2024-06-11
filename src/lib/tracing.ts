import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  BatchSpanProcessor,
  AlwaysOnSampler,
  Sampler,
  SamplingDecision,
} from "@opentelemetry/sdk-trace-base";
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import { SpanKind, Attributes } from "@opentelemetry/api";
import { SEMATTRS_HTTP_ROUTE } from "@opentelemetry/semantic-conventions";

export function initTracing() {
  const provider = new NodeTracerProvider({
    sampler: filterSampler(ignoreHealthCheck, new AlwaysOnSampler()),
  });
  const exporter = new TraceExporter();

  provider.register();
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  registerInstrumentations({
    instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
  });
}

function filterSampler(
  filterFn: (spanName: string, spanKind: SpanKind, attr: Attributes) => boolean,
  parent: Sampler,
): Sampler {
  return {
    shouldSample(ctx, tid, spanName, spanKind, attr, links) {
      if (!filterFn(spanName, spanKind, attr)) {
        return { decision: SamplingDecision.NOT_RECORD };
      }
      return parent.shouldSample(ctx, tid, spanName, spanKind, attr, links);
    },
    toString() {
      return `FilterSampler(${parent.toString()})`;
    },
  };
}

function ignoreHealthCheck(
  spanName: string,
  spanKind: SpanKind,
  attributes: Attributes,
) {
  return (
    spanKind !== SpanKind.SERVER ||
    attributes[SEMATTRS_HTTP_ROUTE] !== "/health"
  );
}

import type { Metric } from "web-vitals";

type ReportHandler = (metric: Metric) => void;

const defaultHandler: ReportHandler = (metric) => {
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });
};

export function reportWebVitals(onReport: ReportHandler = defaultHandler) {
  import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    onCLS(onReport);
    onINP(onReport);
    onLCP(onReport);
    onFCP(onReport);
    onTTFB(onReport);
  });
}

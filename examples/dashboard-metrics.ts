import {
  render,
  Box,
  Text,
  StatusIndicator,
  MetricDisplay,
  createMetric,
  DataRow,
  ListItem,
  HttpStatus,
  SplitView,
  createSplitView,
  useInterval,
} from '../src/index.js';

interface RequestLog {
  id: string;
  method: string;
  path: string;
  status: number;
  latency: number;
  owner: string;
  service: string;
}

const requests: RequestLog[] = [
  { id: 'req_01JY3Y6X4J', method: 'GET', path: '/health', status: 200, latency: 24, owner: 'gateway', service: 'api' },
  { id: 'req_01JY3Y6X4K', method: 'POST', path: '/orders', status: 201, latency: 145, owner: 'worker-03', service: 'orders' },
  { id: 'req_01JY3Y6X4M', method: 'GET', path: '/inventory', status: 503, latency: 821, owner: 'sync-job', service: 'inventory' },
  { id: 'req_01JY3Y6X4N', method: 'DELETE', path: '/sessions/42', status: 404, latency: 63, owner: 'gateway', service: 'auth' },
];

function DashboardMetricsExample() {
  const latency = createMetric({
    label: 'Latency',
    unit: 'ms',
    initial: 145,
    thresholds: {
      success: [0, 120],
      warning: [121, 350],
      error: [351, Infinity],
    },
  });

  const throughput = createMetric({
    label: 'Req/s',
    initial: 842,
    historySize: 16,
    thresholds: {
      muted: [0, 200],
      info: [201, 600],
      success: [601, Infinity],
    },
  });

  const errorRate = createMetric({
    label: 'Errors',
    unit: '%',
    initial: 1.2,
    thresholds: {
      success: [0, 1.5],
      warning: [1.51, 3],
      error: [3.01, Infinity],
    },
  });

  useInterval(() => {
    latency.set(Math.max(20, Math.round(latency.value() + (Math.random() * 160 - 80))));
    throughput.set(Math.max(120, Math.round(throughput.value() + (Math.random() * 220 - 110))));
    errorRate.set(Math.max(0, Number((errorRate.value() + (Math.random() * 1.2 - 0.6)).toFixed(1))));
  }, 900);

  const view = createSplitView({
    items: requests,
    initialIndex: 1,
  });

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      gap: 1,
    },
    Box(
      {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      Text({ bold: true, color: 'cyan' }, 'Operations Dashboard'),
      StatusIndicator({ status: 'running', label: 'Live ingest' })
    ),
    Box(
      {
        flexDirection: 'row',
        gap: 3,
      },
      MetricDisplay({ metric: latency, layout: 'vertical', size: 'large' }),
      MetricDisplay({ metric: throughput, layout: 'vertical' }),
      MetricDisplay({ metric: errorRate, layout: 'vertical' })
    ),
    SplitView<RequestLog>({
      state: view,
      ratio: 0.42,
      renderItem: (item, _index, selected) =>
        ListItem({
          primary: `${item.method} ${item.path}`,
          secondary: `${item.owner} • ${item.latency}ms`,
          trailing: HttpStatus({ code: item.status, variant: 'text' }),
          selected,
          status: item.status >= 500 ? 'error' : item.status >= 400 ? 'warning' : 'success',
        }),
      renderDetail: (item) =>
        item
          ? Box(
              { flexDirection: 'column', gap: 1, paddingLeft: 1 },
              Text({ bold: true }, 'Request Detail'),
              DataRow({ label: 'Request', value: item.id, truncate: 18 }),
              DataRow({ label: 'Route', value: item.path }),
              DataRow({ label: 'Service', value: item.service }),
              DataRow({ label: 'Method', value: item.method }),
              DataRow({
                label: 'Status',
                value: HttpStatus({ code: item.status, showText: true, variant: 'text' }),
                status: item.status >= 500 ? 'error' : item.status >= 400 ? 'warning' : 'success',
              }),
              DataRow({
                label: 'Latency',
                value: `${item.latency}ms`,
                status: item.latency > 500 ? 'error' : item.latency > 200 ? 'warning' : 'success',
              })
            )
          : Box({}, Text({ dim: true }, 'Select a request')),
    })
  );
}

const { waitUntilExit } = render(DashboardMetricsExample);
await waitUntilExit();

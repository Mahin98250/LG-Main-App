import process from 'node:process';

const target = process.env.TARGET_URL || 'https://mahin98250.github.io/LG-Main-App/';
const users = Math.max(1, Math.min(Number(process.env.USERS || 50), 1000));
const requestsPerUser = Math.max(1, Math.min(Number(process.env.REQUESTS_PER_USER || 3), 20));
const timeoutMs = Math.max(1000, Math.min(Number(process.env.TIMEOUT_MS || 15000), 60000));

const totalRequests = users * requestsPerUser;
const samples = [];
let failures = 0;

async function hit() {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'cache-control': 'no-cache' },
    });
    const elapsed = performance.now() - started;
    samples.push(elapsed);
    if (!response.ok) failures += 1;
  } catch {
    failures += 1;
    samples.push(timeoutMs);
  } finally {
    clearTimeout(timer);
  }
}

const started = performance.now();
await Promise.all(
  Array.from({ length: users }, async () => {
    for (let i = 0; i < requestsPerUser; i += 1) await hit();
  }),
);
const duration = performance.now() - started;

samples.sort((a, b) => a - b);
const percentile = (p) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))] ?? 0;
const rps = totalRequests / (duration / 1000);
const errorRate = failures / totalRequests;

console.log(JSON.stringify({
  target,
  concurrent_users: users,
  requests_per_user: requestsPerUser,
  total_requests: totalRequests,
  duration_ms: Number(duration.toFixed(1)),
  requests_per_second: Number(rps.toFixed(2)),
  error_rate: Number(errorRate.toFixed(4)),
  failures,
  latency_ms: {
    p50: Number(percentile(0.50).toFixed(1)),
    p95: Number(percentile(0.95).toFixed(1)),
    p99: Number(percentile(0.99).toFixed(1)),
    max: Number((samples.at(-1) ?? 0).toFixed(1)),
  },
}, null, 2));

if (errorRate >= 0.01) process.exitCode = 1;

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const options = {
    scenarios: {
        resilience: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE || 15),
            timeUnit: '1s',
            duration: __ENV.DURATION || '30s',
            preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
            maxVUs: Number(__ENV.MAX_VUS || 100),
        },
    },
    thresholds: {
        http_req_failed:    ['rate<0.5'],
        resilience_latency: ['p(95)<3000'],
    },
};

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:8080';
const USER_ID    = __ENV.USER_ID    || 'user-a';
const USER_ROLE  = __ENV.USER_ROLE  || 'CUSTOMER';
const USER_STATE = __ENV.USER_STATE || 'ACTIVE';
const TOKEN      = __ENV.CUSTOMER_TOKEN || 'dummy-token';
const MODE       = __ENV.AUTH_MODE  || 'OPA_ONLY';

const resilienceLatency = new Trend('resilience_latency');
const gateway503Rate    = new Rate('gateway_503_rate');
const fastFailureRate   = new Rate('gateway_fast_failure_rate');

export default function () {
    const res = http.get(`${BASE_URL}/shopping-service/api/v1/carts`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'X-User-Id':         USER_ID,
            'X-User-Role':       USER_ROLE,
            'X-User-State':      USER_STATE,
            'X-Experiment-Mode': MODE,
        },
        tags: { scenario: 'resilience', mode: MODE },
        timeout: __ENV.REQUEST_TIMEOUT || '5s',
    });

    resilienceLatency.add(res.timings.duration);
    gateway503Rate.add(res.status === 503);
    fastFailureRate.add(
        res.status === 503 &&
        res.timings.duration < Number(__ENV.FAST_FAILURE_MS || 1000)
    );

    check(res, {
        'status is one of 200, 403, 503':  (r) => [200, 403, 503].includes(r.status),
        'response under upper bound':       (r) => r.timings.duration < Number(__ENV.MAX_ALLOWED_MS || 5000),
    });

    sleep(Number(__ENV.SLEEP_SECONDS || 0.1));
}
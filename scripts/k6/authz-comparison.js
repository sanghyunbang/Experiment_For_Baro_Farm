import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const options = {
    scenarios: {
        authz_comparison: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE || 20),
            timeUnit: '1s',
            duration: __ENV.DURATION || '30s',
            preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
            maxVUs: Number(__ENV.MAX_VUS || 100),
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.05'],
        authz_latency: ['p(95)<1000'],
    },
};

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:8080';
const USER_ID    = __ENV.USER_ID    || 'user-a';
const USER_ROLE  = __ENV.USER_ROLE  || 'CUSTOMER';
const USER_STATE = __ENV.USER_STATE || 'ACTIVE';
const TOKEN      = __ENV.CUSTOMER_TOKEN || 'dummy-token';
const MODE       = __ENV.AUTH_MODE  || 'DB_ONLY';

const authzLatency  = new Trend('authz_latency');
const forbiddenRate = new Rate('authz_forbidden_rate');
const successRate   = new Rate('authz_success_rate');

export default function () {
    const res = http.get(`${BASE_URL}/shopping-service/api/v1/carts`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'X-User-Id':         USER_ID,
            'X-User-Role':       USER_ROLE,
            'X-User-State':      USER_STATE,
            'X-Experiment-Mode': MODE,
        },
        tags: {
            scenario_mode: MODE,
            route: 'shopping-carts',
        },
    });

    authzLatency.add(res.timings.duration);
    forbiddenRate.add(res.status === 403);
    successRate.add(res.status === 200);

    check(res, {
        'status is 200 or 403':  (r) => r.status === 200 || r.status === 403,
        'response time < 2s':    (r) => r.timings.duration < 2000,
    });

    sleep(Number(__ENV.SLEEP_SECONDS || 0.1));
}
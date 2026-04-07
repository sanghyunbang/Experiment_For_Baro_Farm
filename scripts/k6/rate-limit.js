import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

export const options = {
    scenarios: {
        rate_limit: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE || 30),
            timeUnit: '1s',
            duration: __ENV.DURATION || '30s',
            preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 30),
            maxVUs: Number(__ENV.MAX_VUS || 100),
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.2'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN    = __ENV.CUSTOMER_TOKEN || 'dummy-token';
const MODE     = __ENV.RATE_LIMIT_MODE || 'SINGLE_USER';

const tooManyRequestsRate = new Rate('gateway_429_rate');
const successRate         = new Rate('gateway_200_rate');
const forbiddenRate       = new Rate('gateway_403_rate');
const requestCounter      = new Counter('rate_limit_requests');

const userPool = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'];

function resolveUserId() {
    if (MODE === 'MULTI_USER') {
        return userPool[__VU % userPool.length];
    }
    return __ENV.USER_ID || 'user-a';
}

export default function () {
    const userId = resolveUserId();

    const res = http.get(`${BASE_URL}/shopping-service/api/v1/carts`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'X-User-Id':    userId,
            'X-User-Role':  'CUSTOMER',
            'X-User-State': 'ACTIVE',
        },
        tags: {
            scenario: 'rate-limit',
            rate_limit_mode: MODE,
            user_id: userId,
        },
    });

    requestCounter.add(1);
    tooManyRequestsRate.add(res.status === 429);
    successRate.add(res.status === 200);
    forbiddenRate.add(res.status === 403);

    check(res, {
        'status is one of 200, 403, 429': (r) => [200, 403, 429].includes(r.status),
    });

    sleep(Number(__ENV.SLEEP_SECONDS || 0.05));
}
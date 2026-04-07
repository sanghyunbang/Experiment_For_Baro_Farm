import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

export const options = {
    vus: 1,
    iterations: Number(__ENV.ITERATIONS || 1),
    thresholds: {
        opa_propagation_latency_ms: ['p(95)<10000'],
    },
};

const BASE_URL          = __ENV.BASE_URL          || 'http://localhost:8080';
const ADMIN_TOKEN       = __ENV.ADMIN_TOKEN        || 'dummy-admin-token';
const CUSTOMER_TOKEN    = __ENV.CUSTOMER_TOKEN     || 'dummy-customer-token';
const CUSTOMER_USER_ID  = __ENV.CUSTOMER_USER_ID  || 'user-a';
const TARGET_STATE      = __ENV.TARGET_STATE       || 'SUSPENDED';
const POLL_INTERVAL_MS  = Number(__ENV.POLL_INTERVAL_MS  || 300);
const POLL_TIMEOUT_MS   = Number(__ENV.POLL_TIMEOUT_MS   || 15000);

const propagationLatency = new Trend('opa_propagation_latency_ms');

export default function () {
    const start = Date.now();

    // 1. 관리자 상태 변경 호출
    const stateChangeRes = http.post(
        `${BASE_URL}/user-service/api/v1/auth/${CUSTOMER_USER_ID}/state`,
        JSON.stringify({ state: TARGET_STATE }),
        {
            headers: {
                Authorization: `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json',
            },
            tags: { scenario: 'propagation', step: 'state-change' },
        }
    );

    check(stateChangeRes, {
        'state change accepted': (r) => r.status >= 200 && r.status < 300,
    });

    // 2. 403 전환까지 polling
    let blocked = false;

    while (Date.now() - start < POLL_TIMEOUT_MS) {
        const pollRes = http.get(`${BASE_URL}/shopping-service/api/v1/carts`, {
            headers: {
                Authorization: `Bearer ${CUSTOMER_TOKEN}`,
                'X-User-Id':    CUSTOMER_USER_ID,
                'X-User-Role':  'CUSTOMER',
                'X-User-State': 'ACTIVE',   // 헤더는 ACTIVE 유지 → OPA hotlist 차단 여부 확인
            },
            tags: { scenario: 'propagation', step: 'poll-protected-endpoint' },
        });

        if (pollRes.status === 403) {
            blocked = true;
            propagationLatency.add(Date.now() - start);
            break;
        }

        sleep(POLL_INTERVAL_MS / 1000);
    }

    check(null, {
        'protected endpoint became forbidden': () => blocked,
    });
}
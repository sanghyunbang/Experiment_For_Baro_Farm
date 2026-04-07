# Experiment Matrix

실험 비교를 빠르게 하려면 아래 표를 기준으로 토글을 고정하면 된다.

| 실험 이름 | AUTH_MODE | OPA_ENABLED | RATE_LIMIT_ENABLED | FAIL_OPEN | HOTLIST_ENABLED | 목적 |
| --- | --- | --- | --- | --- | --- | --- |
| DB baseline | `DB_ONLY` | `false` | `false` | `false` | `false` | DB 직접 판단 기준선 |
| OPA only | `OPA_ONLY` | `true` | `false` | `false` | `true` | gateway OPA 인가 비용 |
| OPA plus DB | `OPA_PLUS_DB` | `true` | `false` | `false` | `true` | 입구 차단 + 서비스 재검증 비용 |
| Rate limit on | `DB_ONLY` 또는 `OPA_ONLY` | 비교 목적에 맞춤 | `true` | `false` | 실험과 무관 | `429` 제어 확인 |
| Rate limit off | `DB_ONLY` 또는 `OPA_ONLY` | 비교 목적에 맞춤 | `false` | `false` | 실험과 무관 | limiter 영향 제거 |
| Fail closed | `OPA_ONLY` | `true` | `false` | `false` | `true` | OPA 장애 시 `503` 확인 |
| Fail open | `OPA_ONLY` | `true` | `false` | `true` | `true` | OPA 장애 시 통과 확인 |
| Hotlist on | `OPA_ONLY` | `true` | `false` | `false` | `true` | 상태 변경 전파 확인 |
| Hotlist off | `OPA_ONLY` | `true` | `false` | `false` | `false` | 전파 차단 시 동작 확인 |

## 권장 비교 세트

### 정책 인가 비용

1. `DB baseline`
2. `OPA only`
3. `OPA plus DB`

### rate limiting

1. `Rate limit off`
2. `Rate limit on`

추가로 k6 `RATE_LIMIT_MODE`를 바꾼다.

- `SINGLE_USER`
- `MULTI_USER`

### 장애 전파

1. `Fail closed`
2. `Fail open`

둘 다 OPA 장애를 유도해서 비교한다.

### 상태 변경 전파

1. `Hotlist on`
2. `Hotlist off`

둘 다 `propagation.js`로 비교한다.

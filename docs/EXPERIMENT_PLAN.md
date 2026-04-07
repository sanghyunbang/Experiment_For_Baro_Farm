# Experiment Plan

## 목표

이 레포의 1차 목표는 운영 K8s 재현이 아니라, 다음 네 가지를 Docker 기준으로 빠르게 검증하는 것이다.

1. 정책 인가 비용
2. 장애 전파
3. 상태 변경 전파
4. rate limiting 차이

## 왜 이 레포를 분리했는가

- 기존 백엔드 레포는 구현 중인 서비스가 많아 실험 환경 안정성이 낮다.
- 실험에 필요한 서버만 남기면 원인 분리가 쉬워진다.
- K8s보다 Docker Compose가 실험 반복 속도가 빠르다.

## 현재 포함 모듈

- `apps/baro-common`
- `apps/baro-eureka`
- `apps/baro-gateway`
- `apps/baro-user`
- `apps/baro-opa-bundle`
- `apps/sample-shopping`

## 현재 제외 모듈

- Config Server
- order / payment / settlement / notification / ai
- 기존 `baro-shopping`

현재 실험 환경에서는 K8s Service 대신 Eureka를 사용한다.

## 실험 축

### A. 정책 인가 비용

비교 모드:

- `DB_ONLY`
- `OPA_ONLY`
- `OPA_PLUS_DB`

가설:

- `DB_ONLY`는 서비스 내부에서 DB hit가 발생해 지연이 늘어날 수 있다.
- `OPA_ONLY`는 gateway에서 차단하므로 downstream 보호에 유리하다.
- `OPA_PLUS_DB`는 가장 안전하지만 비용이 가장 크다.

### B. 장애 전파

장애 유도:

- OPA down
- shopping down
- 필요 시 OPA delay

가설:

- gateway는 장시간 대기 대신 `503`으로 빠르게 실패해야 한다.
- circuit breaker가 열리고 다른 경로까지 무너지지 않아야 한다.

### C. 상태 변경 전파

흐름:

```text
admin state change -> user -> kafka -> opa-bundle -> OPA poll -> gateway deny
```

가설:

- JWT 만료를 기다리지 않고 몇 초 내 차단 반영이 가능해야 한다.

### D. rate limiting

비교:

- single-user burst
- multi-user distributed traffic

가설:

- 동일 사용자 집중 요청에서 `429`가 먼저 증가해야 한다.
- 다른 사용자로 분산하면 제한 효과가 완화되어야 한다.

## 구현 순서

### Step 1. baseline 기동

- Eureka
- Compose core
- Compose observability
- Eureka dashboard / actuator / OPA health 확인

### Step 2. authz 비교

- `DB_ONLY`
- `OPA_ONLY`
- `OPA_PLUS_DB`

### Step 3. rate limiting

- `SINGLE_USER`
- `MULTI_USER`

### Step 4. propagation

- admin 계정으로 상태 변경
- customer 토큰으로 `403` 전환까지 측정

### Step 5. resilience

- OPA 중지
- shopping 중지
- 필요 시 latency 주입

## 성공 기준

- 세 모드의 latency 차이를 수치로 정리할 수 있다.
- OPA 장애 시 `503` fast-failure를 보여줄 수 있다.
- 상태 변경 후 OPA 반영 시간을 수치로 제시할 수 있다.
- Redis rate limiting의 사용자 단위 제어를 증명할 수 있다.

## 이후 확장 후보

- `sample-order` 추가
- 실제 feature flag 토글 구현
- k6 결과를 Grafana dashboard와 더 강하게 연결
- Toxiproxy로 OPA latency injection 자동화

실행용 환경값은 [ENV_PRESETS.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/ENV_PRESETS.md), AWS 분리 부하는 [AWS_TWO_NODE_SETUP.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/AWS_TWO_NODE_SETUP.md)를 본다.

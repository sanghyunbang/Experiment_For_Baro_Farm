# Load Test Guide

이 문서는 `Experiment_For_Baro_Farm` 레포에서 `Gateway + Eureka + OPA + Hotlist + DB 비교` 실험을 재현하기 위한 기준 문서다.

토큰 준비, seed 사용자, propagation용 실제 UUID 사용자 조건은 [TOKEN_AND_TEST_DATA.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/TOKEN_AND_TEST_DATA.md)를 먼저 본다.

## 목적

- `OPA_ONLY`, `DB_ONLY`, `OPA_PLUS_DB`의 인가 비용 비교
- OPA 또는 downstream 장애 시 fail-fast / fallback 동작 확인
- 사용자 상태 변경 후 OPA 차단 반영까지의 전파 지연 측정
- Redis rate limiting 동작 확인

## 현재 토폴로지

```text
[k6]
  -> [gateway:8080]
       -> [opa:8181]
       -> [baro-user:8080]
       -> [sample-shopping:8082]

[gateway, baro-user, sample-shopping, opa-bundle]
  -> [eureka:8761]

[baro-user]
  -> [mysql:3306]
  -> [redis:6379]
  -> [kafka:9092] -> [opa-bundle:8095] -> [opa]

[grafana:3000] -> [prometheus:9090]
```

## 실험 모드

- `DB_ONLY`
  - gateway는 인증만 처리
  - `sample-shopping`이 DB를 조회해 접근 허용/거부 판단
- `OPA_ONLY`
  - gateway가 OPA로 먼저 차단
  - `sample-shopping`은 비즈니스 조회만 수행
- `OPA_PLUS_DB`
  - gateway에서 OPA 1차 차단
  - `sample-shopping`이 DB로 2차 검증

이 모드 비교에서 핵심은 절대 성능보다 상대 차이다.

- `DB_ONLY` vs `OPA_ONLY`
- `DB_ONLY` vs `OPA_PLUS_DB`
- `OPA_ONLY` vs `OPA_PLUS_DB`

## 실험 토글

- `OPA_ENABLED`
  - `false`면 gateway의 OPA 인가 필터를 통과만 시킴
- `RATE_LIMIT_ENABLED`
  - `false`면 gateway rate limiting이 실질적으로 비활성화됨
- `FAIL_OPEN`
  - `true`면 OPA 오류 시 `503` 대신 요청을 통과시킴
- `HOTLIST_ENABLED`
  - `false`면 user-service가 OPA hotlist Kafka 이벤트를 발행하지 않음

자세한 조합은 [EXPERIMENT_MATRIX.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/EXPERIMENT_MATRIX.md)를 본다.

## 먼저 확인할 설정

### 1. gateway route

`shopping-service-route`는 아래 조건을 만족해야 한다.

- `uri`가 `lb://sample-shopping`을 가리킴
- `Authentication`
- `OpaAuthorization`
- `CircuitBreaker`

`user-service-route`는 `lb://user-service`를 가리켜야 한다.

관련 파일:

- [application-local.yml](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/apps/baro-gateway/src/main/resources/application-local.yml)
- [application-prod.yml](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/apps/baro-gateway/src/main/resources/application-prod.yml)

### 2. OPA 토글과 URL

`OpaAuthorizationGatewayFilterFactory`는 아래 설정을 읽는다.

- `opa.enabled`
- `opa.url`
- `opa.authz-path`
- `opa.timeout-ms`

Compose에서는 `OPA_ENABLED`, `OPA_URL`을 넘긴다.

관련 코드:

- [OpaAuthorizationGatewayFilterFactory.java](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/apps/baro-gateway/src/main/java/com/barofarm/gateway/filter/OpaAuthorizationGatewayFilterFactory.java)

### 3. opa-bundle 포트

`opa-bundle` 기본 포트는 `8095`다. OPA 설정과 Compose 포트가 일치해야 한다.

관련 파일:

- [application.yml](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/apps/baro-opa-bundle/src/main/resources/application.yml)
- [opa-config.yaml](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/infra/baro-opa/opa-config.yaml)

### 4. Eureka 등록

Docker 실험에서는 K8s Service 라우팅 대신 Eureka를 사용한다.

확인 항목:

- gateway가 Eureka client로 등록되는지
- `baro-user`, `sample-shopping`, `opa-bundle`이 Eureka에 등록되는지
- gateway route가 `lb://...` 기반인지

Eureka dashboard:

- `http://localhost:8761`

## 초기 실행 순서

### 1. `.env` 준비

`.env.example`을 복사해 `.env`를 만든다.

필수 확인 값:

- `JWT_SECRET`
- `MYSQL_*`
- `REDIS_PASSWORD`
- `KAFKA_BOOTSTRAP_SERVERS`
- `OPA_BASE_URL`
- `AUTH_MODE`

추천값은 [ENV_PRESETS.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/ENV_PRESETS.md)를 본다.

주의:

- gateway와 `baro-user`가 같은 JWT secret을 써야 한다.
- `shopping-service-route`는 JWT 인증이 필수라서 `dummy-token`으로는 정상 실험이 되지 않는다.

### 2. core stack 실행

```powershell
docker compose --env-file .env -f .\compose\docker-compose.core.yml up -d --build
```

### 3. observability 실행

```powershell
docker compose --env-file .env -f .\compose\docker-compose.observability.yml up -d
```

### 4. health check

```powershell
Invoke-WebRequest http://localhost:8761
Invoke-WebRequest http://localhost:8080/actuator/health
Invoke-WebRequest http://localhost:8082/actuator/health
Invoke-WebRequest http://localhost:8095/actuator/health
Invoke-WebRequest http://localhost:8181/health
Invoke-WebRequest http://localhost:9090/-/healthy
```

## k6 시나리오

### 1. 정책 인가 비용

사전 조건:

- `CUSTOMER_TOKEN`에는 실제 access token을 넣는다.
- `DB_ONLY`, `OPA_PLUS_DB`에서 downstream DB를 자연스럽게 보려면 seed 사용자(`user-a`, `user-b`, `admin-1`)를 쓰는 편이 낫다.

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="DB_ONLY"
$env:OPA_ENABLED="false"
$env:RATE_LIMIT_ENABLED="false"
k6 run .\scripts\k6\authz-comparison.js
```

```powershell
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="OPA_ONLY"
$env:OPA_ENABLED="true"
$env:RATE_LIMIT_ENABLED="false"
k6 run .\scripts\k6\authz-comparison.js
```

```powershell
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="OPA_PLUS_DB"
$env:OPA_ENABLED="true"
$env:RATE_LIMIT_ENABLED="false"
k6 run .\scripts\k6\authz-comparison.js
```

비교 포인트:

- `p95`, `p99`
- `http_req_failed`
- `403` 비율

### 2. rate limiting

```powershell
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:RATE_LIMIT_MODE="SINGLE_USER"
k6 run .\scripts\k6\rate-limit.js
```

```powershell
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:RATE_LIMIT_MODE="MULTI_USER"
k6 run .\scripts\k6\rate-limit.js
```

비교 포인트:

- `429` 비율
- 동일 사용자 집중 요청 시 제한 여부
- 여러 사용자 분산 요청 시 완화 여부

### 3. 상태 변경 전파

주의:

- `CUSTOMER_USER_ID`는 `user-a` 같은 seed 문자열이 아니라 `baro-user`가 가진 실제 `UUID`여야 한다.
- 이 시나리오는 `OPA_ONLY` 기준으로 보는 것이 가장 안전하다. `sample-shopping` seed DB와 `baro-user` 사용자 테이블은 동일 소스가 아니다.

```powershell
$env:BASE_URL="http://localhost:8080"
$env:ADMIN_TOKEN="<admin-jwt>"
$env:CUSTOMER_TOKEN="<customer-jwt>"
$env:CUSTOMER_USER_ID="<customer-user-uuid>"
$env:AUTH_MODE="OPA_ONLY"
k6 run .\scripts\k6\propagation.js
```

핵심 지표:

- `opa_propagation_latency_ms`
- 상태 변경 후 `403` 전환 시간

### 4. 장애 전파

정상 기준선:

```powershell
$env:CUSTOMER_TOKEN="<real-access-token>"
k6 run .\scripts\k6\resilience.js
```

OPA 중단:

```powershell
docker compose --env-file .env -f .\compose\docker-compose.core.yml stop opa
$env:CUSTOMER_TOKEN="<real-access-token>"
k6 run .\scripts\k6\resilience.js
docker compose --env-file .env -f .\compose\docker-compose.core.yml start opa
```

shopping 중단:

```powershell
docker compose --env-file .env -f .\compose\docker-compose.core.yml stop sample-shopping
$env:CUSTOMER_TOKEN="<real-access-token>"
k6 run .\scripts\k6\resilience.js
docker compose --env-file .env -f .\compose\docker-compose.core.yml start sample-shopping
```

비교 포인트:

- `503` 비율
- fast-failure 여부
- `p99`

## Prometheus / Grafana

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

우선 볼 항목:

- `http_server_requests_seconds_*`
- `spring_cloud_gateway_requests_seconds_*`
- `resilience4j_circuitbreaker_*`
- `resilience4j_bulkhead_*`
- `reactor_netty_connection_provider_*`

## 현재 남아 있는 작업

- `OPA_ENABLED`, `RATE_LIMIT_ENABLED`, `FAIL_OPEN`, `HOTLIST_ENABLED`는 현재 실제 코드 경로에서 토글됨
- gateway는 현재 JWT에서 `X-User-Id`, `X-User-Role`만 재작성하고, 상태 차단은 OPA hotlist 데이터에 더 크게 의존함
- 필요 시 `sample-order`를 추가해 shopping 외 시나리오도 비교할 수 있음

프로필 파일 이름과 의미는 [PROFILE_GUIDE.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/PROFILE_GUIDE.md)를 본다.

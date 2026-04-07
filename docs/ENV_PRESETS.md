# Env Presets

이 문서는 `.env`와 k6 실행 시에 바로 쓸 수 있는 추천값 세트를 정리한다.

## 기본 `.env`

```text
OPA_POLICY_DIR=../../infra/baro-opa/policy

IMAGE_TAG=local
JWT_SECRET=change_me_to_a_secure_shared_secret_at_least_32_chars

EUREKA_CLIENT_ENABLED=true
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka:8761/eureka/

MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=baro_experiment
MYSQL_USER=barouser
MYSQL_PASSWORD=baropassword

SPRING_PROFILES_ACTIVE=prod

AUTH_MODE=DB_ONLY
OPA_ENABLED=true
HOTLIST_ENABLED=true
RATE_LIMIT_ENABLED=true
FAIL_OPEN=false

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123

KAFKA_BOOTSTRAP_SERVERS=kafka:9092

OPA_BASE_URL=http://opa:8181
OPA_BUNDLE_URL=http://opa-bundle:8095/opa/bundle
```

`JWT_SECRET`은 gateway와 `baro-user`가 공유해야 한다. 다르면 `shopping-service-route`가 모두 `401`이 된다.

## 로컬 비교 실험 추천값

### 1. DB_ONLY 기준선

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="DB_ONLY"
$env:OPA_ENABLED="false"
$env:RATE_LIMIT_ENABLED="false"
$env:FAIL_OPEN="false"
$env:HOTLIST_ENABLED="false"
```

### 2. OPA_ONLY 비교

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="OPA_ONLY"
$env:OPA_ENABLED="true"
$env:RATE_LIMIT_ENABLED="false"
$env:FAIL_OPEN="false"
$env:HOTLIST_ENABLED="true"
```

### 3. OPA_PLUS_DB 비교

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:AUTH_MODE="OPA_PLUS_DB"
$env:OPA_ENABLED="true"
$env:RATE_LIMIT_ENABLED="false"
$env:FAIL_OPEN="false"
$env:HOTLIST_ENABLED="true"
```

### 4. Rate limit 전용

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:RATE_LIMIT_ENABLED="true"
```

### 5. Fail-open 전용

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:OPA_ENABLED="true"
$env:FAIL_OPEN="true"
```

### 6. Hotlist off 전용

```powershell
$env:BASE_URL="http://localhost:8080"
$env:CUSTOMER_TOKEN="<real-access-token>"
$env:HOTLIST_ENABLED="false"
```

## AWS k6 노드 추천값

EC2-B에서 EC2-A private IP를 호출한다고 가정한다.

```bash
export BASE_URL="http://10.0.1.10:8080"
export CUSTOMER_TOKEN="<real-access-token>"
export AUTH_MODE="OPA_ONLY"
export OPA_ENABLED="true"
export RATE_LIMIT_ENABLED="false"
export FAIL_OPEN="false"
export HOTLIST_ENABLED="true"
```

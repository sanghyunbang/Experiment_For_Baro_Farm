# Token And Test Data Guide

이 문서는 실험을 실제로 재현할 때 가장 자주 막히는 전제 조건을 정리한다.

## 1. JWT secret은 gateway와 user-service가 같아야 한다

`shopping-service-route`에는 `Authentication` 필터가 걸려 있어서, k6나 수동 호출 모두 유효한 JWT가 필요하다.

- `baro-user`는 `BARO_USER_JWT_SECRET`으로 토큰을 발급한다.
- `gateway`는 `JWT_SECRET`으로 토큰을 검증한다.
- 둘이 다르면 `/shopping-service/**` 요청은 전부 `401`이 된다.

현재 Compose 예시는 `.env.example`의 `JWT_SECRET` 하나를 두 서비스에 공통 주입하도록 맞춰져 있다.

## 2. sample-shopping의 seed 사용자와 baro-user의 사용자 ID는 별개다

`sample-shopping`은 MySQL seed 데이터로 아래 사용자를 바로 가진다.

- `user-a`
- `user-b`
- `admin-1`

이 값들은 `infra/mysql/init/02-seed.sql` 기준이며, `DB_ONLY` 또는 `OPA_PLUS_DB`에서 downstream DB 검증용으로 쓰인다.

반면 `baro-user`에서 회원가입/로그인으로 생성되는 사용자 ID는 `UUID`다.

즉 아래 둘은 같은 의미가 아니다.

- `user-a`: sample-shopping seed ID
- `550e8400-e29b-41d4-a716-446655440000`: baro-user가 발급하는 실제 사용자 ID 예시

## 3. 시나리오별 추천 사용자 전략

### 정책 인가 비용 비교

- `DB_ONLY`, `OPA_PLUS_DB`
  - seed 사용자(`user-a`, `user-b`, `admin-1`)를 써야 downstream 조회가 자연스럽다.
- `OPA_ONLY`
  - gateway/OPA 차단 비용만 보려면 실제 `baro-user` 로그인 토큰을 써도 된다.
  - cart 데이터는 비어 있을 수 있지만, 인가 경로 검증에는 문제가 없다.

### 상태 변경 전파

이 시나리오는 `OPA_ONLY` 기준으로 보는 것이 가장 안전하다.

- `/user-service/api/v1/auth/{userId}/state`는 `UUID` 사용자 ID를 요구한다.
- OPA hotlist 이벤트도 `UUID` subject ID로 전파된다.
- 따라서 `CUSTOMER_USER_ID`에는 seed ID가 아니라 `baro-user`에서 발급된 실제 `UUID`를 넣어야 한다.

## 4. 토큰 확보 방법

### 방법 A. local profile의 자동 admin 사용

`baro-user`를 `local` profile로 직접 실행하면 `LocalAdminBootstrap`이 아래 계정을 자동 생성할 수 있다.

- email: `local-admin@baro.test`
- password: `admin123`

이 bootstrap은 `local` profile 전용이다. Compose의 `prod` profile에서는 자동 생성되지 않는다.

### 방법 B. 직접 회원가입 후 로그인

1. 이메일 인증 코드 발송
2. 이메일 인증 코드 검증
3. 회원가입
4. 로그인

실제 엔드포인트는 `baro-user` 기준 아래와 같다.

- `POST /api/v1/auth/verification/email/send-code`
- `POST /api/v1/auth/verification/email/verify-code`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`

로그인/회원가입 응답은 토큰을 응답 바디가 아니라 `HttpOnly` 쿠키로 내려준다.
필요하면 브라우저 개발자도구나 API 클라이언트에서 `access_token`, `refresh_token` 쿠키 값을 추출해 k6 환경변수에 넣는다.

## 5. k6 실행 전 최소 확인 항목

- `.env`에 `JWT_SECRET`이 설정되어 있는지
- gateway와 user-service가 같은 secret을 쓰는지
- `CUSTOMER_TOKEN`이 실제 `baro-user`가 발급한 access token인지
- propagation 시 `CUSTOMER_USER_ID`가 실제 `UUID`인지
- `DB_ONLY` 또는 `OPA_PLUS_DB`에서는 seed 사용자와 downstream DB 데이터가 맞는지

## 6. 자주 보는 오해

- `dummy-token`으로도 k6가 돌아갈 것이라고 생각하면 안 된다.
  - 현재 gateway `Authentication` 필터는 서명 검증을 수행한다.
- `user-a`를 그대로 상태 변경 API에 넣으면 안 된다.
  - 해당 API는 `UUID` path variable을 받는다.
- OPA가 JWT claim만 보고 막는다고 생각하면 안 된다.
  - 현재 gateway는 `X-User-Id`, `X-User-Role`만 토큰에서 재작성하고, 상태 차단은 hotlist 데이터에 더 크게 의존한다.

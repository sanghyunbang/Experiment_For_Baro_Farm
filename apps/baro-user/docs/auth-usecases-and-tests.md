# Auth 유즈케이스 및 테스트 메모

이 문서는 현재 `apps/baro-user` 구현 기준으로 auth 흐름과 테스트 포인트를 짧게 정리한다.

## 현재 구현된 주요 엔드포인트

- 이메일 인증
  - `POST /api/v1/auth/verification/email/send-code`
  - `POST /api/v1/auth/verification/email/verify-code`
- 이메일 로그인
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/me/withdraw`
- 비밀번호
  - `POST /api/v1/auth/password/reset/request`
  - `POST /api/v1/auth/password/reset/confirm`
  - `POST /api/v1/auth/password/change`
- OAuth
  - `POST /api/v1/auth/oauth/state`
  - `GET|POST /api/v1/auth/oauth/callback`
  - `POST /api/v1/auth/me/oauth/link/start`
  - `POST /api/v1/auth/oauth/link/callback`
- 관리자
  - `GET /api/v1/auth/admin/users`
  - `POST /api/v1/auth/{userId}/state`

## 현재 구현 특징

- 로그인/회원가입/OAuth 로그인 응답은 access token, refresh token을 `HttpOnly` 쿠키로 내려준다.
- refresh token은 `refresh_token` 테이블에 사용자당 1개 행으로 유지된다.
- `/auth/refresh`는 기존 사용자 행을 새 토큰 값으로 교체한다.
- 로그아웃은 refresh token을 revoke 처리한다.
- 사용자 상태 변경과 seller 상태 변경은 OPA hotlist 이벤트 발행과 연결된다.
- 탈퇴 시 refresh token 폐기, OAuth 계정 정리, outbox 이벤트 적재가 함께 수행된다.

## 테스트할 때 특히 볼 항목

### 인증/토큰

- 회원가입 성공 시 쿠키 2개가 내려오는지
- 로그인 성공 시 쿠키 2개가 내려오는지
- `/auth/refresh`가 기존 refresh token을 새 값으로 회전시키는지
- 로그아웃 후 동일 refresh token으로 재발급이 실패하는지

### 이메일 인증

- 잘못된 코드, 만료 코드, 미인증 이메일 회원가입이 적절히 실패하는지
- 인증 성공 후 회원가입 시 최신 인증 내역 소비가 정상인지

### 관리자 상태 변경

- `POST /api/v1/auth/{userId}/state`가 ADMIN 권한 없이 막히는지
- 상태 변경 후 refresh token 강제 폐기가 일어나는지
- OPA hotlist 이벤트가 publish 되는지

### OAuth

- `/auth/oauth/state`가 state 값을 발급하는지
- callback에서 state 검증 실패 시 거절되는지
- link callback이 다른 사용자 계정과 충돌할 때 막히는지

### 탈퇴 / outbox

- 탈퇴 후 계정 정보가 비식별화되는지
- OAuth 연동 정보가 정리되는지
- `outbox_event`가 생성되는지

## 문서상 주의

- 오래된 메모처럼 "refresh API가 아직 없다"는 내용은 더 이상 맞지 않는다.
- 오래된 메모처럼 "토큰을 바디로 반환한다"는 설명도 맞지 않는다. 현재는 쿠키 기반이다.
- 로컬 admin bootstrap은 `local` profile 전용이며 Compose `prod`에서는 자동 생성되지 않는다.

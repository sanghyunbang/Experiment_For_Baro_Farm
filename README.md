# Experiment For Baro Farm

이 레포는 운영 K8s 재현이 아니라 `Gateway + Eureka + OPA + Hotlist + DB 비교`를 Docker Compose 기준으로 빠르게 검증하기 위한 실험용 백엔드다.

## 현재 포함 모듈

- `apps/baro-common`
- `apps/baro-eureka`
- `apps/baro-gateway`
- `apps/baro-user`
- `apps/baro-opa-bundle`
- `apps/sample-shopping`

## 핵심 포인트

- gateway는 `lb://user-service`, `lb://sample-shopping`으로 라우팅한다.
- Docker 실험에서는 Eureka를 띄워 Spring Cloud discovery 기반으로 테스트한다.
- OPA, rate limiting, fail-open, hotlist는 모두 env 토글로 비교 가능하다.
- `shopping-service-route`는 JWT 인증을 반드시 거치므로, k6에도 실제 access token이 필요하다.

## 빠른 시작 전 체크

1. `.env.example`을 복사해 `.env`를 만든다.
2. `JWT_SECRET`을 설정한다.
3. `baro-user`와 `gateway`가 같은 secret을 쓰는지 확인한다.
4. 실험용 토큰과 사용자 ID 준비는 [docs/TOKEN_AND_TEST_DATA.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/TOKEN_AND_TEST_DATA.md)를 먼저 본다.

## 문서 순서

- [docs/LOAD_TEST_GUIDE.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/LOAD_TEST_GUIDE.md)
- [docs/TOKEN_AND_TEST_DATA.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/TOKEN_AND_TEST_DATA.md)
- [docs/EXPERIMENT_PLAN.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/EXPERIMENT_PLAN.md)
- [docs/ENV_PRESETS.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/ENV_PRESETS.md)
- [docs/EXPERIMENT_MATRIX.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/EXPERIMENT_MATRIX.md)
- [docs/PROFILE_GUIDE.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/PROFILE_GUIDE.md)
- [docs/AWS_TWO_NODE_SETUP.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/AWS_TWO_NODE_SETUP.md)

## 결과를 읽기 위한 환경 정보

README에 성능 결과를 올릴 때는 최소한 아래 정보가 같이 있어야 한다.

- 배치
  - 2노드 구성 권장
  - EC2-A: Docker Compose 서버 스택
  - EC2-B: k6 부하 생성기
- 예시 인스턴스
  - 서버 노드: `t3.large`
  - 부하 노드: `t3.medium`
- 서버 스택
  - `gateway`, `eureka`, `baro-user`, `sample-shopping`, `opa-bundle`, `opa`, `mysql`, `redis`, `kafka`
- 관측
  - `prometheus`, `grafana`
- 실험 토글
  - `AUTH_MODE`
  - `OPA_ENABLED`
  - `RATE_LIMIT_ENABLED`
  - `FAIL_OPEN`
  - `HOTLIST_ENABLED`
- 공통 전제
  - gateway와 `baro-user`는 같은 `JWT_SECRET` 사용
  - k6는 실제 `CUSTOMER_TOKEN` 사용

상세 절차와 보안그룹, SSH 터널, EC2 역할 분리는 [docs/AWS_TWO_NODE_SETUP.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/AWS_TWO_NODE_SETUP.md)를 본다.
실험 토글 조합은 [docs/EXPERIMENT_MATRIX.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/EXPERIMENT_MATRIX.md), 추천 환경값은 [docs/ENV_PRESETS.md](C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/docs/ENV_PRESETS.md)를 본다.

## 결과 기록 템플릿

아래 항목까지 같이 남겨야 결과표가 나중에도 해석 가능하다.

| 항목 | 값 |
| --- | --- |
| 실험 날짜 | TBD |
| 서버 노드 | TBD |
| 부하 노드 | TBD |
| 서버 배치 | `EC2-A server / EC2-B k6` |
| 대상 프로필 | `prod` |
| BASE_URL | TBD |
| RATE / DURATION | TBD |
| AUTH_MODE | TBD |
| OPA_ENABLED | TBD |
| RATE_LIMIT_ENABLED | TBD |
| FAIL_OPEN | TBD |
| HOTLIST_ENABLED | TBD |
| 비고 | TBD |

## 성능 결과표

아래 표는 최종 실험 결과를 README에 바로 붙일 수 있도록 비워 둔 템플릿이다.

| 실험 | 조건 | 인스턴스/배치 | RATE / DURATION | p50 | p95 | p99 | 실패율 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authz | `DB_ONLY` | TBD | TBD | TBD | TBD | TBD | TBD | |
| Authz | `OPA_ONLY` | TBD | TBD | TBD | TBD | TBD | TBD | |
| Authz | `OPA_PLUS_DB` | TBD | TBD | TBD | TBD | TBD | TBD | |
| Rate limit | `SINGLE_USER` | TBD | TBD | TBD | TBD | TBD | `429` TBD | |
| Rate limit | `MULTI_USER` | TBD | TBD | TBD | TBD | TBD | `429` TBD | |
| Resilience | `OPA down / fail-closed` | TBD | TBD | TBD | TBD | TBD | `503` TBD | |
| Resilience | `OPA down / fail-open` | TBD | TBD | TBD | TBD | TBD | 우회율 TBD | |
| Propagation | `state -> deny` | TBD | TBD | - | TBD | - | - | `403` 전환 시간 |

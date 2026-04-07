# Profile Guide

## 왜 아직 `local` / `prod`를 쓰는가

이 레포는 실험용이지만, 기존 `beadv2_2_dogs_BE` 구조를 최대한 덜 깨뜨리기 위해 파일 이름은 일단 `application-local.yml`, `application-prod.yml`를 유지한다.

하지만 이 레포에서의 의미는 일반적인 운영 의미와 조금 다르다.

## 현재 의미

| Profile | 현재 의미 | 주 사용처 |
| --- | --- | --- |
| `local` | IntelliJ 또는 로컬 직접 실행용 | IDE에서 단일 서비스 실행 |
| `prod` | Docker Compose 실험용 | 현재 기본 실험 환경 |

즉, 현재 `prod`는 "운영 배포 프로필"이라기보다 "Docker 실험 프로필"에 가깝다.

## 왜 이렇게 두었는가

- 원본 레포 구조와 대응이 쉽다.
- 기존 설정을 가져올 때 수정량이 줄어든다.
- 당장 실험을 우선할 수 있다.

## 나중에 정리한다면

더 직관적으로 바꾸려면 아래처럼 가는 게 낫다.

| 추천 이름 | 의미 |
| --- | --- |
| `application-dev.yml` | IDE 개발용 |
| `application-docker.yml` | Docker Compose 실험용 |
| `application-aws.yml` | AWS 2노드 실험용 |

## 현재 권장

- 당장은 유지
- 문서에서 의미를 명시
- 실험이 안정화되면 `docker/aws` 프로필로 리네이밍 검토

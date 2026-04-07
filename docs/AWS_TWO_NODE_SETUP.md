# AWS Two Node Setup

이 문서는 AWS에서 서버 노드와 부하 노드를 분리하는 가장 단순한 구성을 설명한다.

## 구성

```text
Local PC
  -> 브라우저 / SSH

EC2-A
  -> Docker Compose 서버 스택

EC2-B
  -> k6 부하 생성기
```

## 역할

### EC2-A

- `eureka`
- `gateway`
- `baro-user`
- `sample-shopping`
- `opa-bundle`
- `opa`
- `mysql`
- `redis`
- `kafka`
- `prometheus`
- `grafana`

### EC2-B

- `k6`
- 실험 스크립트

## 보안그룹

### Server Node SG

- `22/tcp`: 내 IP
- `8080/tcp`: Load Node SG
- `8761/tcp`: 내 IP
- `3000/tcp`: 내 IP
- `9090/tcp`: 내 IP

선택:

- `8081/tcp`, `8082/tcp`, `8095/tcp`, `8181/tcp`: 내 IP

### Load Node SG

- `22/tcp`: 내 IP

## EC2-A 준비

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates gnupg
```

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

```bash
git clone <YOUR_REPO_URL>
cd Experiment_For_Baro_Farm
cp .env.example .env
# .env 에 JWT_SECRET 을 반드시 채운다.
docker compose --env-file .env -f compose/docker-compose.core.yml up -d --build
docker compose --env-file .env -f compose/docker-compose.observability.yml up -d
docker compose --env-file .env -f compose/docker-compose.core.yml ps
```

## EC2-B 준비

```bash
sudo apt-get update
sudo apt-get install -y gnupg2 ca-certificates software-properties-common git
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install -y k6
```

```bash
git clone <YOUR_REPO_URL>
cd Experiment_For_Baro_Farm
```

## k6 실행 예시

### DB_ONLY

```bash
export BASE_URL="http://<EC2-A-PRIVATE-IP>:8080"
export CUSTOMER_TOKEN="<real-access-token>"
export AUTH_MODE="DB_ONLY"
export OPA_ENABLED="false"
export RATE_LIMIT_ENABLED="false"
export FAIL_OPEN="false"
export HOTLIST_ENABLED="false"
k6 run ./scripts/k6/authz-comparison.js
```

### OPA_ONLY

```bash
export BASE_URL="http://<EC2-A-PRIVATE-IP>:8080"
export CUSTOMER_TOKEN="<real-access-token>"
export AUTH_MODE="OPA_ONLY"
export OPA_ENABLED="true"
export RATE_LIMIT_ENABLED="false"
export FAIL_OPEN="false"
export HOTLIST_ENABLED="true"
k6 run ./scripts/k6/authz-comparison.js
```

### OPA_PLUS_DB

```bash
export BASE_URL="http://<EC2-A-PRIVATE-IP>:8080"
export CUSTOMER_TOKEN="<real-access-token>"
export AUTH_MODE="OPA_PLUS_DB"
export OPA_ENABLED="true"
export RATE_LIMIT_ENABLED="false"
export FAIL_OPEN="false"
export HOTLIST_ENABLED="true"
k6 run ./scripts/k6/authz-comparison.js
```

## Grafana 접속

EC2는 CLI로 서버를 띄우는 용도고, Grafana는 로컬 PC 브라우저에서 본다.

### 방법 1. Public IP로 직접 접속

- `http://<EC2-A-PUBLIC-IP>:3000`

### 방법 2. SSH 터널

```bash
ssh -i <key.pem> -L 3000:localhost:3000 ubuntu@<EC2-A-PUBLIC-IP>
```

그 다음 로컬 브라우저:

- `http://localhost:3000`

Eureka도 같은 방식으로 가능하다.

```bash
ssh -i <key.pem> -L 8761:localhost:8761 ubuntu@<EC2-A-PUBLIC-IP>
```

그 다음:

- `http://localhost:8761`

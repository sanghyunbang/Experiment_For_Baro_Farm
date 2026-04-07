# OPA Bundle Service

This module consumes hotlist events from Kafka, builds an OPA bundle (policy + data),
and serves it over an internal HTTP endpoint.

## Internal access

The bundle endpoint is intended for internal use only. Access is restricted by:

- Private IPv4 ranges or loopback by default
- Optional CIDR allowlist
- Optional shared token (header `X-Internal-Token`)

Example configuration:

```
opa:
  access:
    enabled: true
    allow-private: true
    allowed-cidrs:
      - 10.0.0.0/8
      - 172.16.0.0/12
      - 192.168.0.0/16
    require-token: true
    token: change-me
```

## OPA pull configuration

Example OPA config to pull the bundle (see [`infra/baro-opa/opa-config.yaml`](/C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/infra/baro-opa/opa-config.yaml)):

```
services:
  opa-bundle:
    url: http://opa-bundle:8095
    headers:
      X-Internal-Token: change-me

bundles:
  baro:
    service: opa-bundle
    resource: /opa/bundle
    polling:
      min_delay_seconds: 10
      max_delay_seconds: 60
```

The bundle service now expects `OPA_POLICY_DIR` from the environment.

- Compose DNS name for OPA pull is `opa-bundle`
- Spring application name is `opa-bundle-service`

- Local profile fallback in [`application-local.yml`](/C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/apps/baro-opa-bundle/src/main/resources/application-local.yml): `../../infra/baro-opa/policy`
- Compose example in [`compose/docker-compose.core.yml`](/C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/compose/docker-compose.core.yml): `/workspace/infra/baro-opa/policy`
- Example env file entry in [`.env.example`](/C:/Users/mm206/Experiment/Experiment_For_Baro_Farm/.env.example)

Examples:

```powershell
$env:SPRING_PROFILES_ACTIVE='local'
$env:OPA_POLICY_DIR='../../infra/baro-opa/policy'
./gradlew :apps:baro-opa-bundle:bootRun
```

```yaml
environment:
  SPRING_PROFILES_ACTIVE: local
  OPA_POLICY_DIR: /workspace/infra/baro-opa/policy
```

## Kafka event schema

```
{
  "eventId": "evt-20260108-001",
  "subjectType": "user",
  "subjectId": "123",
  "active": true,
  "status": "BLOCKED",
  "flags": ["SUSPENDED"],
  "reason": "manual",
  "updatedAt": "2026-01-08T12:00:00Z"
}
```

## Hotlist data (static bootstrap)

Static hotlist files can seed initial entries and are merged into the generated
`data.json` when the bundle is built:

- `infra/baro-opa/policy/data/hotlist/users.json`
- `infra/baro-opa/policy/data/hotlist/sellers.json`

Format (top-level key must match the filename):

```
{
  "users": {
    "123": { "status": "BLOCKED", "flags": ["SUSPENDED"], "reason": "manual", "updatedAt": "2026-01-08T12:00:00Z" }
  }
}
```

Merge rule: dynamic hotlist entries from events take precedence. Static entries
only fill missing subject IDs and do not override existing entries.

FROM openpolicyagent/opa:0.70.0-static

WORKDIR /app

COPY infra/baro-opa/opa-config.yaml /config/opa-config.yaml

EXPOSE 8181

ENTRYPOINT ["/opa", "run", "--server", "--config-file=/config/opa-config.yaml", "--addr=0.0.0.0:8181"]

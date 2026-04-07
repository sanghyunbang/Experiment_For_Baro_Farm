FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

COPY . .

RUN ./gradlew :apps:baro-opa-bundle:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/apps/baro-opa-bundle/build/libs/*.jar app.jar

EXPOSE 8095

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

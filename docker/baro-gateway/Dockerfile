FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

COPY . .

RUN ./gradlew :apps:baro-gateway:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/apps/baro-gateway/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

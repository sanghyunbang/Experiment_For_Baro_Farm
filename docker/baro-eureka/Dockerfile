FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

COPY . .

RUN ./gradlew :apps:baro-eureka:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/apps/baro-eureka/build/libs/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

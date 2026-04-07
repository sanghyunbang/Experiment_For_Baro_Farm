FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

COPY . .

RUN ./gradlew :apps:sample-shopping:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/apps/sample-shopping/build/libs/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# Utilisation d'une image Java très légère
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# On copie directement le JAR que vous venez de compiler sur Windows
COPY target/*.jar app.jar

# Configuration pour accélérer le démarrage de Spring
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
package ma.enset.orderservice.exception;


import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        // Extraction de l'utilisateur qui a causé l'erreur
        String user = SecurityContextHolder.getContext().getAuthentication().getName();

        // Log de l'erreur avec identification (Point 12.2 et 12.3)
        log.error("TRACE-ERROR: Utilisateur [{}] a déclenché une exception : {}", user, ex.getMessage());

        return new ResponseEntity<>(
                Map.of("error", ex.getMessage(), "user", user),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
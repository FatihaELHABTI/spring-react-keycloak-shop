package ma.enset.apigateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class LoggingFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        String method = exchange.getRequest().getMethod().name();

        // Log de l'accès API (Point 12.1)
        log.info("GATEWAY-ACCESS: Requête {} sur le chemin {}", method, path);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            log.info("GATEWAY-RESPONSE: Réponse renvoyée pour {}", path);
        }));
    }
}
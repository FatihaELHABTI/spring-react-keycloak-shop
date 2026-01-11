package ma.enset.orderservice.web;

import lombok.extern.slf4j.Slf4j;
import ma.enset.orderservice.entities.Order;
import ma.enset.orderservice.entities.OrderStatus;
import ma.enset.orderservice.entities.ProductItem;
import ma.enset.orderservice.feign.ProductRestClient;
import ma.enset.orderservice.model.Product;
import ma.enset.orderservice.repository.OrderRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final ProductRestClient productRestClient;

    public OrderController(OrderRepository orderRepository, ProductRestClient productRestClient) {
        this.orderRepository = orderRepository;
        this.productRestClient = productRestClient;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public Order getOrder(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        log.info("TRACE-LOG: Utilisateur [{}] consulte la commande #{}", jwt.getClaimAsString("preferred_username"), id);
        return orderRepository.findById(id).orElseThrow();
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CLIENT')")
    public List<Order> getMyOrders(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        log.info("TRACE-LOG: Utilisateur [{}] consulte son historique de commandes", username);
        return orderRepository.findByCustomerId(jwt.getSubject());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Order> getAllOrders(@AuthenticationPrincipal Jwt jwt) {
        log.warn("TRACE-SECURITY: ADMIN [{}] liste TOUTES les commandes du système", jwt.getClaimAsString("preferred_username"));
        return orderRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public Order createOrder(@RequestBody List<ProductItem> items, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        log.info("TRACE-LOG: Utilisateur [{}] lance une création de commande ({} types de produits)", username, items.size());

        Order order = Order.builder()
                .createdAt(new Date())
                .status(OrderStatus.CREATED)
                .customerId(jwt.getSubject())
                .build();

        double total = 0;
        for (ProductItem item : items) {
            // Réduction du stock via Feign
            productRestClient.reduceStock(item.getProductId(), item.getQuantity());

            Product p = productRestClient.getProductById(item.getProductId());
            item.setProductName(p.getName());
            item.setPrice(p.getPrice());
            item.setOrder(order);
            total += p.getPrice() * item.getQuantity();

            log.debug("Détail Commande: Produit {} ajouté (Qté: {})", p.getName(), item.getQuantity());
        }
        order.setProductItems(items);
        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);
        log.info("TRACE-SUCCESS: Commande #{} enregistrée pour [{}] - Total: {} DH", savedOrder.getId(), username, total);
        return savedOrder;
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    public Order cancelOrder(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        log.warn("TRACE-LOG: Utilisateur [{}] demande l'annulation de la commande #{}", jwt.getClaimAsString("preferred_username"), id);
        Order order = orderRepository.findById(id).orElseThrow();
        if (order.getStatus() == OrderStatus.CANCELED) throw new RuntimeException("Commande déjà annulée");

        order.setStatus(OrderStatus.CANCELED);
        return orderRepository.save(order);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getOrderStats(@AuthenticationPrincipal Jwt jwt) {
        log.info("TRACE-LOG: ADMIN [{}] accède aux statistiques financières globales", jwt.getClaimAsString("preferred_username"));
        List<Order> orders = orderRepository.findAll();
        double totalRevenue = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELED)
                .mapToDouble(Order::getTotalAmount).sum();
        return Map.of(
                "totalOrders", orders.size(),
                "totalRevenue", totalRevenue,
                "canceledOrders", orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELED).count()
        );
    }

    @GetMapping("/my-stats")
    @PreAuthorize("hasRole('CLIENT')")
    public Map<String, Object> getMyPersonalStats(@AuthenticationPrincipal Jwt jwt) {
        String clientId = jwt.getSubject();
        log.info("TRACE-LOG: Client [{}] consulte son tableau de bord personnel", jwt.getClaimAsString("preferred_username"));
        List<Order> myOrders = orderRepository.findByCustomerId(clientId);

        double totalSpent = myOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELED)
                .mapToDouble(Order::getTotalAmount).sum();

        return Map.of(
                "count", myOrders.size(),
                "spent", totalSpent,
                "active", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.CREATED).count()
        );
    }
}
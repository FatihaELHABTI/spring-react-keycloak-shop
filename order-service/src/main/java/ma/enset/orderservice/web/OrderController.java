package ma.enset.orderservice.web;



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
    public Order getOrder(@PathVariable Long id) {
        return orderRepository.findById(id).orElseThrow();
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CLIENT')")
    public List<Order> getMyOrders(@AuthenticationPrincipal Jwt jwt) {
        return orderRepository.findByCustomerId(jwt.getSubject());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public Order createOrder(@RequestBody List<ProductItem> items, @AuthenticationPrincipal Jwt jwt) {
        Order order = Order.builder()
                .createdAt(new Date())
                .status(OrderStatus.CREATED)
                .customerId(jwt.getSubject())
                .build();

        double total = 0;
        for (ProductItem item : items) {
            // 1. Appel au produit pour réduire le stock (PERSISTANCE)
            productRestClient.reduceStock(item.getProductId(), item.getQuantity());

            // 2. Récupérer le prix pour le total
            Product p = productRestClient.getProductById(item.getProductId());
            item.setProductName(p.getName());
            item.setPrice(p.getPrice());
            item.setOrder(order);
            total += p.getPrice() * item.getQuantity();
        }
        order.setProductItems(items);
        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    public Order cancelOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElseThrow();
        if (order.getStatus() == OrderStatus.CANCELED) throw new RuntimeException("Déjà annulée");

        order.setStatus(OrderStatus.CANCELED);
        // Note: Dans un vrai système, on devrait ici ré-augmenter le stock (ProductRestClient.increaseStock)
        return orderRepository.save(order);
    }
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')") // Seul l'admin voit le CA global
    public Map<String, Object> getOrderStats() {
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
        String clientId = jwt.getSubject(); // On récupère l'ID du client depuis le JWT
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
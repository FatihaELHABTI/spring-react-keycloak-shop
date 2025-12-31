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

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final ProductRestClient productRestClient;

    public OrderController(OrderRepository orderRepository, ProductRestClient productRestClient) {
        this.orderRepository = orderRepository;
        this.productRestClient = productRestClient;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public Order createOrder(@RequestBody List<ProductItem> items, @AuthenticationPrincipal Jwt jwt) {
        Order order = Order.builder()
                .createdAt(new Date())
                .status(OrderStatus.CREATED)
                .customerId(jwt.getSubject()) // On récupère le sub du JWT
                .build();

        double total = 0;
        for (ProductItem item : items) {
            Product product = productRestClient.getProductById(item.getProductId());

            // Vérification disponibilité (Point 5 & 6 du PDF)
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException("Stock insuffisant pour: " + product.getName());
            }

            item.setPrice(product.getPrice());
            item.setOrder(order);
            total += product.getPrice() * item.getQuantity();
        }

        order.setProductItems(items);
        order.setTotalAmount(total);
        return orderRepository.save(order);
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
}
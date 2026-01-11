package ma.enset.orderservice.feign;

import ma.enset.orderservice.model.Product;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "product-service")
public interface ProductRestClient {
    @GetMapping("/api/products/{id}")
    Product getProductById(@PathVariable Long id);

    @PutMapping("/api/products/{id}/reduce-stock")
    void reduceStock(@PathVariable Long id, @RequestParam int quantity);
}

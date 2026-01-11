package ma.enset.productservice.web;

import lombok.extern.slf4j.Slf4j;
import ma.enset.productservice.entities.Product;
import ma.enset.productservice.repository.ProductRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Product addProduct(@RequestBody Product product, @AuthenticationPrincipal Jwt jwt) {
        log.info("TRACE-CATALOGUE: ADMIN [{}] ajoute un nouveau produit : {}", jwt.getClaimAsString("preferred_username"), product.getName());
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product, @AuthenticationPrincipal Jwt jwt) {
        log.info("TRACE-CATALOGUE: ADMIN [{}] modifie le produit #{}", jwt.getClaimAsString("preferred_username"), id);
        Product existingProduct = productRepository.findById(id).orElseThrow();
        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setStockQuantity(product.getStockQuantity());
        return productRepository.save(existingProduct);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        log.warn("TRACE-CATALOGUE: ADMIN [{}] supprime le produit #{}", jwt.getClaimAsString("preferred_username"), id);
        productRepository.deleteById(id);
    }

    @PutMapping("/{id}/reduce-stock")
    @PreAuthorize("hasRole('CLIENT')")
    public void reduceStock(@PathVariable Long id, @RequestParam int quantity, @AuthenticationPrincipal Jwt jwt) {
        Product product = productRepository.findById(id).orElseThrow();
        log.info("TRACE-STOCK: Réduction de stock pour [{}] par l'utilisateur [{}] - Quantité: {}", product.getName(), jwt.getClaimAsString("preferred_username"), quantity);

        if (product.getStockQuantity() < quantity) {
            log.error("TRACE-ERROR: Rupture de stock pour le produit #{}", id);
            throw new RuntimeException("Stock insuffisant");
        }
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getProductStats(@AuthenticationPrincipal Jwt jwt) {
        log.info("TRACE-LOG: ADMIN [{}] consulte les statistiques de l'inventaire", jwt.getClaimAsString("preferred_username"));
        return Map.of(
                "totalProducts", productRepository.count(),
                "lowStock", productRepository.findAll().stream().filter(p -> p.getStockQuantity() < 5).count()
        );
    }
}
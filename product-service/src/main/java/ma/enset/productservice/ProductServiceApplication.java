package ma.enset.productservice;


import ma.enset.productservice.entities.Product;
import ma.enset.productservice.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }

    /*@Bean
    CommandLineRunner start(ProductRepository productRepository) {
        return args -> {
            productRepository.save(new Product(null, "Ordinateur", "Macbook Pro", 25000, 10));
            productRepository.save(new Product(null, "Imprimante", "HP Laser", 3000, 5));
            productRepository.save(new Product(null, "Smartphone", "iPhone 15", 12000, 20));
        };
    }*/
}
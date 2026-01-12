# Plateforme E-Commerce Microservices

## Vue d'ensemble

Une plateforme e-commerce moderne construite avec une **architecture microservices** utilisant Spring Boot, Spring Cloud, React et Keycloak pour l'authentification. Le projet implémente les meilleures pratiques de sécurité, traçabilité et scalabilité.

---

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Diagrammes et flux](#diagrammes-et-flux)
3. [Captures d'écran](#captures-décran)
4. [Technologies utilisées](#technologies-utilisées)
5. [Concepts clés](#concepts-clés)
6. [Code important](#code-important)
7. [Installation](#installation)
8. [Sécurité](#sécurité)

---

## Architecture du système

### Schéma global

![Architecture Globale](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/arch_glb.png)

L'architecture est composée de plusieurs couches distinctes:

#### 1. Couche Frontend
- **React 18 + Vite** (Port 3000)
- Interface utilisateur moderne avec Tailwind CSS 4
- Gestion de l'authentification via Keycloak

#### 2. Couche Gateway
- **Spring Cloud Gateway** (Port 8888)
- Point d'entrée unique pour toutes les requêtes
- Validation JWT centralisée
- Routage intelligent vers les microservices
- Filtrage et logging des requêtes

#### 3. Couche Services
- **Product Service** (Port 8081): Gestion du catalogue
- **Order Service** (Port 8082): Gestion des commandes
- Communication inter-services via OpenFeign

#### 4. Couche Infrastructure
- **Eureka Discovery Service** (Port 8761): Enregistrement des services
- **Keycloak** (Port 8080): Serveur d'authentification OAuth2/OIDC
- **PostgreSQL**: Deux bases de données distinctes (product_db, order_db)

### Architecture détaillée

```
┌─────────────┐
│ Utilisateur │
└──────┬──────┘
       │ Accès Port 3000
       ▼
┌────────────────────────┐
│  Frontend React/Vite   │
│  - Keycloak Integration│
│  - JWT Token Storage   │
└──────┬─────────────────┘
       │ API Calls Port 8888
       ▼
┌────────────────────────────────┐
│      API Gateway               │
│  ┌──────────────────────────┐  │
│  │  JWT Validation          │  │
│  │  Route Mapping           │  │
│  │  CORS Configuration      │  │
│  │  Global Logging Filter   │  │
│  └──────────────────────────┘  │
└───────┬──────────────┬─────────┘
        │              │
    ┌───▼────┐    ┌────▼────┐
    │ Lookup │    │ Forward │
    │ Eureka │    │ Request │
    └───┬────┘    └────┬────┘
        │              │
        │    ┌─────────▼─────────┐
        │    │                   │
    ┌───▼─────────┐    ┌─────────▼────┐
    │   Product   │◄───┤Order Service │
    │   Service   │    │(Feign Client)│
    │             │    │              │
    │ PostgreSQL  │    │  PostgreSQL  │
    │ product_db  │    │  order_db    │
    └─────────────┘    └──────────────┘

┌──────────────────────────────────────┐
│  Sécurité & Registry                 │
│  ┌──────────────┐  ┌───────────────┐ │
│  │  Keycloak    │  │    Eureka     │ │
│  │  Auth Server │  │   Discovery   │ │
│  └──────────────┘  └───────────────┘ │
└──────────────────────────────────────┘
```

---

## Diagrammes et flux

### Flux d'authentification

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│Utilisateur│         │ Frontend │         │ Keycloak │
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                     │
      │ 1. Accès /login    │                     │
      ├───────────────────►│                     │
      │                    │                     │
      │                    │ 2. Redirect OAuth2  │
      │                    ├────────────────────►│
      │                    │                     │
      │ 3. Page Login      │                     │
      │◄───────────────────┴─────────────────────┤
      │                                          │
      │ 4. Username/Password                     │
      ├─────────────────────────────────────────►│
      │                                          │
      │                    │ 5. JWT Token        │
      │                    │◄────────────────────┤
      │ 6. Redirect + JWT  │                     │
      │◄───────────────────┤                     │
      │                    │                     │
      │ 7. API Call + JWT  │                     │
      ├───────────────────►│                     │
      │                    │                     │
```

### Flux de création de commande (Diagramme de séquence)

![Diagramme de séquence - Création de commande](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/diag_seq.png)

**Étapes détaillées:**

1. **Utilisateur → Frontend**: Clic sur "Valider la Commande"
2. **Frontend → API Gateway**: `POST /api/orders` avec JWT dans le header
3. **API Gateway → Keycloak**: Validation du JWT
4. **API Gateway → Order Service**: Forward de la requête validée
5. **Order Service**: Boucle pour chaque produit du panier:
   - **Order Service → Product Service** (via Feign): `PUT /api/products/{id}/reduce-stock?quantity=X`
   - **Product Service**: Vérifie le stock disponible
   - **Product Service**: Réduit le stock si suffisant
   - **Product Service → Order Service**: `200 OK`
   - **Order Service → Product Service** (via Feign): `GET /api/products/{id}`
   - **Product Service → Order Service**: Retourne nom & prix du produit
6. **Order Service**: Calcul du montant total
7. **Order Service**: Sauvegarde de la commande en base PostgreSQL
8. **Order Service → API Gateway**: `201 Created` avec l'objet Order
9. **API Gateway → Frontend**: Réponse JSON
10. **Frontend → Utilisateur**: Toast de succès + Rafraîchissement du catalogue

### Architecture de sécurité

```
┌────────────────────────────────────────────────┐
│              SÉCURITÉ CENTRALISÉE              │
└────────────────────────────────────────────────┘

Flow JWT:
  
  1. Login via Keycloak
     ↓
  2. JWT Token émis
     {
       "sub": "user-uuid",
       "preferred_username": "admin",
       "realm_access": {
         "roles": ["ADMIN", "CLIENT"]
       }
     }
     ↓
  3. Token stocké dans le frontend
     ↓
  4. Chaque requête inclut: 
     Authorization: Bearer <JWT>
     ↓
  5. API Gateway valide auprès de Keycloak
     ↓
  6. Si valide → Forward aux microservices
     ↓
  7. Microservices extraient les rôles
     ↓
  8. @PreAuthorize vérifie les permissions
```

---

## Captures d'écran

### 1. Infrastructure - Eureka Dashboard

![Eureka Dashboard](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/capture_server_eureka.png)

**Description**: Console Eureka montrant l'enregistrement de tous les microservices (API-GATEWAY, PRODUCT-SERVICE, ORDER-SERVICE). Chaque service affiche son statut UP avec son adresse IP et port.

---

### 2. Keycloak - Configuration du client React

![Keycloak Client React](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/react_client.png)

**Description**: Configuration du client `react-client` dans Keycloak:
- Type: Public (pas de client secret)
- Root URL: `http://localhost:3000`
- Valid Redirect URIs configurées
- Web Origins pour CORS

---

### 3. Keycloak - Credentials du backend

![Keycloak Backend Credentials](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/spring-backend-client.png)

**Description**: Client `spring-backend-client` avec authentification par Client Secret pour les communications inter-services sécurisées.

---

### 4. Page de connexion

![Page de connexion Keycloak](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/login.png)

**Description**: Interface de connexion Keycloak personnalisée avec le realm `ecom-realm`. L'utilisateur saisit ses identifiants pour obtenir un JWT.

---

### 5. Dashboard Administrateur

![Dashboard Admin](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/admin_dash.png)

**Description**: Vue d'ensemble de l'administrateur affichant:
- **Revenu Global**: 314 000 DH
- **Ventes Totales**: 14 commandes
- **Alertes Stock**: 1 produit en rupture
- État des services cloud (Auth, Gateway, Products, Orders)
- Badge "ADMINISTRATEUR" en haut à droite

---

### 6. Dashboard Client

![Dashboard Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/user_dash.png)


**Description**: Tableau de bord personnel du client USER1:
- **Total Dépensé**: 74 000 DH
- **Mes Commandes**: 2
- **En cours**: 2 commandes actives
- Badge "CLIENT" visible

---

### 7. Catalogue produits (Admin)

![Catalogue Admin](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/admin_prdcts.png)
![Dashboard Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/ajout_produit.png)
![Dashboard Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/modifier_produit.png)

**Description**: Vue administrateur du catalogue avec:
- Liste des produits (Imprimante, Ordinateur, Smartphone)
- Prix et stock disponible
- Boutons d'édition et suppression pour chaque produit
- Bouton "Nouveau Produit" en haut à droite

---

### 8. Catalogue produits (Client)

![Catalogue Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/user_catalogue.png)
![Catalogue Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/produit_dets.png)

**Description**: Vue client du catalogue:
- Affichage des produits avec prix
- Icône panier pour ajouter au panier
- Indicateur de stock disponible
- Pas de boutons d'édition/suppression

---

### 9. Modal de détails de commande

![Détails Commande](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/details_commandes.png)

**Description**: Modal "FACTURE" affichant:
- Commande #13
- Liste des produits: Ordinateur (x2), Smartphone (x1)
- Prix unitaires
- **Montant Total Payé**: 62 000 DH
- Référence client (UUID tronqué)

---

### 10. Liste des commandes (Admin)

![Commandes Admin](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/admin_commndes.png)

**Description**: Vue administrateur de toutes les commandes:
- Statuts variés: CANCELED (rouge), CREATED (orange)
- Dates de création
- Bouton "Détails" pour chaque commande
- Montants affichés en DH

---

### 11. Liste des commandes (Client)

![Commandes Client](https://github.com/FatihaELHABTI/spring-react-keycloak-shop/blob/main/imgs/user_commandes.png)

**Description**: Historique personnel de USER1:
- Commande #13: 62 000 DH (CREATED)
- Commande #14: 12 000 DH (CREATED)
- Bouton de suppression (icône poubelle)
- Bouton "Détails" pour consulter la facture

---

## Technologies utilisées

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Java | 17 | Langage principal |
| Spring Boot | 3.2.2 | Framework applicatif |
| Spring Cloud | 2023.0.0 | Écosystème microservices |
| Spring Security | 6.x | Sécurisation OAuth2 |
| Spring Cloud Gateway | 4.x | API Gateway réactive |
| Netflix Eureka | 4.x | Service Discovery |
| OpenFeign | 4.x | Client HTTP déclaratif |
| PostgreSQL | 15 | Base de données |
| Keycloak | 22.0.1 | Serveur d'authentification |
| Lombok | 1.18.34 | Réduction du boilerplate |
| Spring Boot Actuator | 3.2.2 | Monitoring & Health checks |

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18 | Bibliothèque UI |
| Vite | 5.x | Build tool ultra-rapide |
| Tailwind CSS | 4 | Framework CSS utility-first |
| React Router | 6.x | Routing côté client |
| Axios | 1.x | Client HTTP |
| Keycloak JS | 22.x | Intégration Keycloak |
| React Hot Toast | 2.x | Notifications |
| Lucide React | 0.x | Icônes modernes |

### Infrastructure

- **Docker** & **Docker Compose**: Orchestration des conteneurs
- **Maven**: Gestionnaire de dépendances Java

---

## Concepts clés

### 1. Architecture Microservices

**Principe**: Découpage de l'application en services autonomes, chacun responsable d'un domaine métier spécifique.

**Avantages implémentés**:
- **Scalabilité indépendante**: Chaque service peut être scalé séparément
- **Technologie hétérogène**: Possibilité d'utiliser différentes technologies par service
- **Déploiement indépendant**: Mise à jour d'un service sans affecter les autres
- **Résilience**: La défaillance d'un service n'impacte pas tout le système

**Dans ce projet**:
```
product-service  → Gère le catalogue (CRUD produits, stock)
order-service    → Gère les commandes et communique avec product-service
api-gateway      → Point d'entrée unique, routage et sécurité
discovery-service → Enregistrement et découverte des services
```

### 2. Service Discovery avec Eureka

**Concept**: Les microservices s'enregistrent automatiquement auprès d'Eureka et peuvent se découvrir mutuellement sans configuration d'URL en dur.

**Configuration (product-service)**:
```yaml
eureka:
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${spring.cloud.client.ip-address}:${server.port}
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**Bénéfices**:
- Pas d'URL hardcodées
- Load balancing automatique
- Failover automatique si un service tombe

### 3. API Gateway Pattern

**Principe**: Un point d'entrée unique qui route les requêtes vers les microservices appropriés.

**Responsabilités dans ce projet**:
- Routage basé sur le path (`/api/products/**` → product-service)
- Validation JWT centralisée
- CORS configuration
- Logging global des requêtes
- Rate limiting (optionnel)

**Avantages**:
- Simplifie le client (une seule URL)
- Centralise la sécurité
- Facilite la traçabilité

### 4. OAuth2 / OpenID Connect avec Keycloak

**Concept**: Délégation de l'authentification à un serveur spécialisé (Keycloak) qui émet des tokens JWT.

**Flow implémenté** (Authorization Code Flow):
```
1. User → Frontend → Redirect to Keycloak
2. User → Login on Keycloak
3. Keycloak → Redirect to Frontend with Authorization Code
4. Frontend → Exchange Code for JWT (automatique avec react-keycloak)
5. Frontend → API calls avec JWT dans Authorization header
```

**Structure du JWT**:
```json
{
  "sub": "58ad8ceb-534a-4b7c-a123-456789abcdef",
  "preferred_username": "admin",
  "realm_access": {
    "roles": ["ADMIN", "CLIENT"]
  },
  "exp": 1704891234,
  "iss": "http://localhost:8080/realms/ecom-realm"
}
```

### 5. Communication inter-services avec OpenFeign

**Concept**: Client HTTP déclaratif qui simplifie les appels REST entre microservices.

**Sans Feign** (verbeux):
```java
RestTemplate restTemplate = new RestTemplate();
String url = "http://product-service/api/products/" + id;
HttpHeaders headers = new HttpHeaders();
headers.setBearerAuth(token);
HttpEntity<String> entity = new HttpEntity<>(headers);
ResponseEntity<Product> response = restTemplate.exchange(url, HttpMethod.GET, entity, Product.class);
```

**Avec Feign** (déclaratif):
```java
@FeignClient(name = "product-service")
public interface ProductRestClient {
    @GetMapping("/api/products/{id}")
    Product getProductById(@PathVariable Long id);
}
```

### 6. Security - Resource Server

**Concept**: Chaque microservice valide le JWT localement sans appeler Keycloak à chaque fois.

**Mécanisme**:
1. Keycloak expose une clé publique (JWKS endpoint)
2. Les services téléchargent cette clé au démarrage
3. Les services valident la signature JWT localement

**Configuration**:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/ecom-realm
```

### 7. RBAC (Role-Based Access Control)

**Concept**: Restriction d'accès basée sur les rôles utilisateur.

**Implémentation**:
```java
@PreAuthorize("hasRole('ADMIN')")  // Seuls les ADMIN
public List<Order> getAllOrders() { ... }

@PreAuthorize("hasRole('CLIENT')") // Seuls les CLIENT
public Order createOrder() { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')") // Les deux
public List<Product> getAllProducts() { ... }
```

### 8. Observabilité et Traçabilité

**Concept**: Logging structuré avec identification de l'utilisateur pour audit et debugging.

**Implémentation**:
```java
log.info("TRACE-LOG: Utilisateur [{}] consulte la commande #{}", 
    jwt.getClaimAsString("preferred_username"), orderId);
```

**Logs produits**:
```
GATEWAY-ACCESS: Requête GET sur le chemin /api/orders/13
TRACE-LOG: Utilisateur [admin] consulte la commande #13
GATEWAY-RESPONSE: Réponse renvoyée pour /api/orders/13
```

---

## Code important

### 1. Configuration Security - API Gateway

**Fichier**: `api-gateway/SecurityConfig.java`

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable) // Désactivé car API REST
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/**").permitAll() // Health checks publics
                .anyExchange().authenticated() // Tout le reste nécessite authentification
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Collections.singletonList("http://localhost:3000"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Collections.singletonList("*"));
        config.setAllowCredentials(true); // Important pour envoyer les cookies
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

**Points clés**:
- `EnableWebFluxSecurity`: Security pour Spring WebFlux (réactif)
- `oauth2ResourceServer`: Active la validation JWT
- CORS configuré pour accepter le frontend sur port 3000

---

### 2. Logging Filter Global

**Fichier**: `api-gateway/LoggingFilter.java`

```java
@Slf4j
@Component
public class LoggingFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        String method = exchange.getRequest().getMethod().name();

        // Log de la requête entrante
        log.info("GATEWAY-ACCESS: Requête {} sur le chemin {}", method, path);

        // Continue le traitement et log la réponse
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            log.info("GATEWAY-RESPONSE: Réponse renvoyée pour {}", path);
        }));
    }
}
```

**Utilité**: Traçabilité de toutes les requêtes passant par la gateway.

---

### 3. Conversion des rôles JWT en Authorities Spring

**Fichier**: `product-service/security/JwtAuthConverter.java`

```java
@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = 
        new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // Combine les authorities par défaut avec les rôles du realm
        Collection<GrantedAuthority> authorities = Stream.concat(
                jwtGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractResourceRoles(jwt).stream()
        ).collect(Collectors.toSet());
        
        return new JwtAuthenticationToken(jwt, authorities, jwt.getClaim("preferred_username"));
    }

    private Collection<? extends GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return Set.of();
        
        Collection<String> roles = (Collection<String>) realmAccess.get("roles");
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
    }
}
```

**Explications**:
1. Extrait le claim `realm_access` du JWT
2. Récupère la liste des rôles
3. Préfixe chaque rôle avec `ROLE_` (convention Spring Security)
4. Convertit en `GrantedAuthority`

**Résultat**: Les annotations `@PreAuthorize("hasRole('ADMIN')")` fonctionnent correctement.

---

### 4. Propagation du JWT via Feign

**Fichier**: `order-service/security/FeignInterceptor.java`

```java
@Component
public class FeignInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Vérifie si l'utilisateur est authentifié avec un JWT
        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            // Ajoute le token dans le header Authorization
            template.header("Authorization", "Bearer " + jwtToken.getToken().getTokenValue());
        }
    }
}
```

**Problème résolu**: Sans cet intercepteur, les appels Feign d'order-service vers product-service échoueraient avec 401 Unauthorized car le JWT ne serait pas transmis.

**Flow**:
```
Client → Gateway (JWT) → Order-Service (JWT stocké dans SecurityContext)
                              ↓
                    Feign Client appelle Product-Service
                              ↓
                    FeignInterceptor ajoute JWT au header
                              ↓
                    Product-Service reçoit le JWT et valide
```

---

### 5. Création de commande avec réduction de stock

**Fichier**: `order-service/web/OrderController.java`

```java
@PostMapping
@PreAuthorize("hasRole('CLIENT')")
public Order createOrder(@RequestBody List<ProductItem> items, @AuthenticationPrincipal Jwt jwt) {
    String username = jwt.getClaimAsString("preferred_username");
    log.info("TRACE-LOG: Utilisateur [{}] lance une création de commande ({} types de produits)", 
        username, items.size());

    // Création de la commande
    Order order = Order.builder()
            .createdAt(new Date())
            .status(OrderStatus.CREATED)
            .customerId(jwt.getSubject()) // UUID de l'utilisateur
            .build();

    double total = 0;
    for (ProductItem item : items) {
        // 1. Réduction du stock via Feign (peut throw exception si stock insuffisant)
        productRestClient.reduceStock(item.getProductId(), item.getQuantity());

        // 2. Récupération des infos produit
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
    log.info("TRACE-SUCCESS: Commande #{} enregistrée pour [{}] - Total: {} DH", 
        savedOrder.getId(), username, total);
    
    return savedOrder;
}
```

**Points importants**:
1. **Transaction implicite**: `@Transactional` par défaut sur les méthodes de contrôleur
2. **Appels Feign**: Communication synchrone avec product-service
3. **Gestion d'erreur**: Si `reduceStock` échoue, la transaction est rollback
4. **Traçabilité**: Logs avec username pour audit

---

### 6. Réduction de stock atomique

**Fichier**: `product-service/web/ProductController.java`

```java
@PutMapping("/{id}/reduce-stock")
@PreAuthorize("hasRole('CLIENT')")
public void reduceStock(@PathVariable Long id, @RequestParam int quantity, @AuthenticationPrincipal Jwt jwt) {
    Product product = productRepository.findById(id).orElseThrow();
    
    log.info("TRACE-STOCK: Réduction de stock pour [{}] par l'utilisateur [{}] - Quantité: {}", 
        product.getName(), jwt.getClaimAsString("preferred_username"), quantity);

    // Vérification du stock
    if (product.getStockQuantity() < quantity) {
        log.error("TRACE-ERROR: Rupture de stock pour le produit #{}", id);
        throw new RuntimeException("Stock insuffisant");
    }
    
    // Réduction atomique
    product.setStockQuantity(product.getStockQuantity() - quantity);
    productRepository.save(product);
}
```

**Problème potentiel** (non résolu dans cette version):
Si deux commandes simultanées tentent de commander le dernier produit en stock, une **race condition** peut survenir.

**Solution avancée** (pour amélioration):
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Product findByIdWithLock(@Param("id") Long id);
```

---

### 7. Configuration React + Keycloak

**Fichier**: `frontend-react/src/App.jsx`

```javascript
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './services/keycloak';

function App() {
    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{ 
                onLoad: 'login-required', // Force la connexion dès le chargement
                checkLoginIframe: false    // Désactive l'iframe de vérification
            }}
        >
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/orders" element={<Orders />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ReactKeycloakProvider>
    );
}
```

**Configuration Keycloak**:
```javascript
// frontend-react/src/services/keycloak.js
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "ecom-realm",
    clientId: "react-client",
});

export default keycloak;
```

**Points clés**:
- `onLoad: 'login-required'`: Redirige vers Keycloak si non authentifié
- `checkLoginIframe: false`: Évite les problèmes de CORS avec l'iframe

---

### 8. Intercepteur Axios pour JWT

**Fichier**: `frontend-react/src/services/api.js`

```javascript
import axios from "axios";
import keycloak from "./keycloak";

const api = axios.create({
    baseURL: "http://localhost:8888", // API Gateway
    withCredentials: true
});

// Intercepteur qui ajoute automatiquement le JWT à chaque requête
api.interceptors.request.use((config) => {
    if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
});

export default api;
```

**Utilisation dans les composants**:
```javascript
import api from '../services/api';

// Pas besoin de gérer manuellement le token
const response = await api.get('/api/products');
const response = await api.post('/api/orders', orderData);
```

---

### 9. Gestion du panier côté client

**Fichier**: `frontend-react/src/pages/Products.jsx`

```javascript
const [cart, setCart] = useState([]);

// Ajout au panier
const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
        toast.error("Rupture de stock !");
        return;
    }
    
    setCart(prevCart => {
        const existing = prevCart.find(item => item.id === product.id);
        if (existing) {
            // Incrémente la quantité si déjà dans le panier
            return prevCart.map(item =>
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
            );
        }
        // Ajoute le nouveau produit
        return [...prevCart, { ...product, quantity: 1 }];
    });
    
    toast.success(`${product.name} ajouté au panier`);
};

// Validation de la commande
const finalizeOrder = async () => {
    if (cart.length === 0) return;
    
    try {
        // Prépare la structure attendue par le backend
        const orderItems = cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));

        await api.post('/api/orders', orderItems);
        setCart([]); // Vide le panier
        toast.success("Commande validée !");
        fetchProducts(); // Rafraîchit pour voir les stocks mis à jour
    } catch (err) {
        toast.error("Échec de la commande : Stock insuffisant.");
    }
};
```

**Logique du panier**:
- État local React (pas de persistance)
- Vérification du stock avant ajout
- Incrémentation de quantité si produit déjà présent
- Envoi d'un tableau d'objets `{productId, quantity}` au backend

---

### 10. Gestion des erreurs globale

**Fichier**: `api-gateway/exception/GlobalExceptionHandler.java`

```java
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        // Extraction de l'utilisateur depuis le SecurityContext
        String user = SecurityContextHolder.getContext().getAuthentication().getName();

        // Log structuré pour traçabilité
        log.error("TRACE-ERROR: Utilisateur [{}] a déclenché une exception : {}", user, ex.getMessage());

        // Réponse JSON avec infos d'erreur
        return new ResponseEntity<>(
                Map.of("error", ex.getMessage(), "user", user),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
```

**Avantages**:
- Capture toutes les exceptions non gérées
- Trace l'utilisateur responsable de l'erreur
- Retourne une réponse JSON cohérente au client

---

## Installation

### Prérequis

- **Java 17+**
- **Node.js 18+**
- **Docker** & **Docker Compose**
- **Maven 3.8+**

### Étape 1: Cloner le projet

```bash
git clone https://github.com/votre-username/ecommerce-microservices.git
cd ecommerce-microservices
```

### Étape 2: Démarrer l'infrastructure

```bash
docker-compose up -d
```

Vérifie que les conteneurs sont actifs:
```bash
docker-compose ps
```

Services démarrés:
- PostgreSQL product_db (port 5433)
- PostgreSQL order_db (port 5434)
- Keycloak (port 8080)

### Étape 3: Configurer Keycloak

1. **Accès**: `http://localhost:8080`
2. **Login**: `admin` / `admin`
3. **Créer un realm**: `ecom-realm`
4. **Créer les clients**:

#### Client React (Public)
```
Client ID: react-client
Client Protocol: openid-connect
Access Type: public
Valid Redirect URIs: http://localhost:3000/*
Web Origins: http://localhost:3000
```

#### Client Backend (Confidential)
```
Client ID: spring-backend-client
Access Type: confidential
Service Accounts Enabled: On
Générer et copier le Client Secret
```

5. **Créer les rôles**: `ADMIN`, `CLIENT`
6. **Créer des utilisateurs**:
```
Username: admin
Password: admin
Role: ADMIN

Username: user1
Password: user1
Role: CLIENT
```

### Étape 4: Démarrer les microservices

**Terminal 1 - Discovery Service**:
```bash
cd discovery-service
mvn spring-boot:run
```

Attendre le message: `Started DiscoveryServiceApplication`

**Terminal 2 - API Gateway**:
```bash
cd api-gateway
mvn spring-boot:run
```

**Terminal 3 - Product Service**:
```bash
cd product-service
mvn spring-boot:run
```

**Terminal 4 - Order Service**:
```bash
cd order-service
mvn spring-boot:run
```

### Étape 5: Démarrer le frontend

```bash
cd frontend-react
npm install
npm run dev
```

Accéder à: `http://localhost:3000`

### Vérification

- **Eureka**: `http://localhost:8761` (tous les services doivent apparaître)
- **Keycloak**: `http://localhost:8080`
- **API Gateway**: `http://localhost:8888/actuator/health`
- **Frontend**: `http://localhost:3000` (redirection vers Keycloak)

---

## Sécurité

### Flux de sécurisation des requêtes

1. **Utilisateur non authentifié** → Redirection vers Keycloak
2. **Authentification réussie** → JWT émis et stocké
3. **Requête API** → JWT dans header `Authorization: Bearer <token>`
4. **API Gateway** → Validation JWT (signature, expiration, issuer)
5. **Routage** → Forward vers le microservice avec JWT
6. **Microservice** → Extraction des rôles et vérification `@PreAuthorize`
7. **Réponse** → Si autorisé, traitement et réponse

### Validation JWT (sans appel à Keycloak)

Les microservices téléchargent la **clé publique** de Keycloak au démarrage:

```
GET http://localhost:8080/realms/ecom-realm/protocol/openid-connect/certs
```

Ensuite, chaque JWT est validé **localement** en vérifiant:
- La signature avec la clé publique
- L'expiration (`exp` claim)
- L'émetteur (`iss` claim)

**Avantage**: Performances élevées, pas de latence réseau.

### RBAC - Contrôle d'accès

**Matrice de permissions**:

| Endpoint | ADMIN | CLIENT |
|----------|-------|--------|
| GET /api/products | ✅ | ✅ |
| POST /api/products | ✅ | ❌ |
| PUT /api/products/{id} | ✅ | ❌ |
| DELETE /api/products/{id} | ✅ | ❌ |
| GET /api/orders | ✅ | ❌ |
| GET /api/orders/my-orders | ❌ | ✅ |
| POST /api/orders | ❌ | ✅ |
| PUT /api/orders/{id}/cancel | ❌ | ✅ |

### Bonnes pratiques implémentées

1. **Principe du moindre privilège**: Les clients ne voient que leurs données
2. **Validation centralisée**: Gateway valide avant de router
3. **Tokens courts**: JWT expire après 5 minutes (configurable)
4. **Refresh tokens**: Gérés automatiquement par Keycloak
5. **CORS restrictif**: Seul `http://localhost:3000` autorisé
6. **CSRF désactivé**: Car API REST stateless (pas de cookies de session)

---

## Tests

### Test du flux complet (manuel)

1. **Login**: Accéder à `http://localhost:3000` → Authentification
2. **Catalogue**: Ajouter des produits au panier
3. **Commande**: Valider la commande
4. **Vérification**:
   - Le stock doit avoir diminué
   - La commande apparaît dans "Mes Commandes"
   - Les logs affichent la traçabilité:
```
GATEWAY-ACCESS: Requête POST sur le chemin /api/orders
TRACE-LOG: Utilisateur [user1] lance une création de commande (2 types de produits)
TRACE-STOCK: Réduction de stock pour [Ordinateur] par l'utilisateur [user1] - Quantité: 2
TRACE-SUCCESS: Commande #13 enregistrée pour [user1] - Total: 62000.0 DH
```

### Test de sécurité

**Sans JWT** (doit échouer):
```bash
curl http://localhost:8888/api/products
# Réponse: 401 Unauthorized
```

**Avec JWT invalide** (doit échouer):
```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:8888/api/products
# Réponse: 401 Unauthorized
```

**Avec JWT valide ADMIN** (doit réussir):
```bash
# 1. Obtenir le token (via Postman ou autre)
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI..."

# 2. Appel API
curl -H "Authorization: Bearer $TOKEN" http://localhost:8888/api/products
# Réponse: 200 OK avec liste des produits
```

---

## Améliorations possibles

### Court terme
- Tests unitaires et d'intégration avec JUnit 5 et Testcontainers
- Pagination des produits et commandes
- Recherche et filtres avancés
- Upload d'images pour les produits

### Moyen terme
- Circuit Breaker avec Resilience4j
- Caching distribué avec Redis
- API Gateway rate limiting
- Notifications par email (service dédié)
- Gestion des transactions distribuées (Saga Pattern)

### Long terme
- Event-Driven Architecture avec Kafka
- Monitoring avec Prometheus + Grafana
- Tracing distribué avec Zipkin/Jaeger
- Déploiement Kubernetes avec Helm
- CI/CD avec GitHub Actions
- Multi-tenancy et internationalisation

---



package com.example.technova_erp;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stock-movements")
public class StockMovementController {

    private final StockMovementRepository repository;

    public StockMovementController(
            StockMovementRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<StockMovementResponse> getAllMovements() {

        return repository.findAll()
                .stream()
                .sorted(
                        Comparator.comparing(
                                StockMovement::getCreatedAt
                        ).reversed()
                )
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/product/{productId}")
    public List<StockMovementResponse> getByProduct(
            @PathVariable Long productId) {

        return repository
                .findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StockMovementResponse toResponse(
            StockMovement movement) {

        return new StockMovementResponse(
                movement.getId(),
                movement.getProduct().getId(),
                movement.getProduct().getName(),
                movement.getProduct().getSku(),
                movement.getQuantityChange(),
                movement.getPurchaseOrder() != null
                        ? movement.getPurchaseOrder().getId()
                        : null,
                movement.getSalesOrder() != null
                        ? movement.getSalesOrder().getId()
                        : null,
                movement.getCreatedAt()
        );
    }
}

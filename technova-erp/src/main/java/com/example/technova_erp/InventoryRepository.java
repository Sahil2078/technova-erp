
package com.example.technova_erp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    boolean existsByProductId(Long productId);

    Optional<Inventory> findByProductId(Long productId);

    @Query("""
        SELECT i FROM Inventory i
        WHERE i.quantity <= i.minimumStock
    """)
    List<Inventory> findLowStock();

    @Query("""
        SELECT COUNT(i) FROM Inventory i
        WHERE i.quantity <= i.minimumStock
    """)
    long countLowStock();

    @Query("""
        SELECT i FROM Inventory i
        WHERE i.supplier.id = :supplierId
    """)
    List<Inventory> findBySupplierId(
            @Param("supplierId") Long supplierId
    );
}


package com.example.technova_erp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface PurchaseOrderRepository
        extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findBySupplierId(Long supplierId);

    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);

    @Query("""
        SELECT SUM(p.totalAmount)
        FROM PurchaseOrder p
        WHERE p.status = :status
    """)
    BigDecimal sumTotalByStatus(
            @Param("status") PurchaseOrderStatus status
    );

    List<PurchaseOrder> findByOrderByCreatedAtDescIdDesc(
            Pageable pageable
    );
}


package com.example.technova_erp.report;

import com.example.technova_erp.PurchaseOrder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PurchaseOrderReportRepository
        extends JpaRepository<PurchaseOrder, Long> {

    @Query("""
        SELECT p
        FROM PurchaseOrder p
        JOIN FETCH p.supplier
        WHERE p.createdAt >= :startDate
          AND p.createdAt < :endDate
        ORDER BY p.createdAt DESC, p.id DESC
    """)
    List<PurchaseOrder> findPurchaseReportBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

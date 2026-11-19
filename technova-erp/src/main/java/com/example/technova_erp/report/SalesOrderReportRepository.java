
package com.example.technova_erp.report;

import com.example.technova_erp.SalesOrder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SalesOrderReportRepository
        extends JpaRepository<SalesOrder, Long> {

    @Query("""
        SELECT s
        FROM SalesOrder s
        JOIN FETCH s.customer
        WHERE s.createdAt >= :startDate
          AND s.createdAt < :endDate
        ORDER BY s.createdAt DESC, s.id DESC
    """)
    List<SalesOrder> findSalesReportBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

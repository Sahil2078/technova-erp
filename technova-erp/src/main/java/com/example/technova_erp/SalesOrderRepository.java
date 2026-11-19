
package com.example.technova_erp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface SalesOrderRepository
        extends JpaRepository<SalesOrder, Long> {

    List<SalesOrder> findByCustomerId(Long customerId);

    List<SalesOrder> findByStatus(SalesOrderStatus status);

    @Query("""
        SELECT SUM(s.totalAmount)
        FROM SalesOrder s
        WHERE s.status = :status
    """)
    BigDecimal sumTotalByStatus(
            @Param("status") SalesOrderStatus status
    );

    @Query("""
        SELECT SUM(s.totalAmount)
        FROM SalesOrder s
        WHERE s.status = :status
          AND s.confirmedAt >= :startDate
          AND s.confirmedAt < :endDate
    """)
    BigDecimal sumConfirmedRevenueBetween(
            @Param("status") SalesOrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<SalesOrder> findByOrderByCreatedAtDescIdDesc(
            Pageable pageable
    );
}

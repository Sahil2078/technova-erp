package com.example.technova_erp.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SalesReportItemResponse(
        Long orderId,
        String customerName,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt
) {
}
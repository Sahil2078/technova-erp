package com.example.technova_erp.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseReportItemResponse(
        Long orderId,
        Long supplierId,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime receivedAt
) {
}
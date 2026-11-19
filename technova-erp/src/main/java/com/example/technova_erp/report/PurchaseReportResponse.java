
package com.example.technova_erp.report;

import java.math.BigDecimal;
import java.util.List;

public record PurchaseReportResponse(
        long totalOrders,
        BigDecimal totalExpenses,
        List<PurchaseReportItemResponse> orders
) {
}

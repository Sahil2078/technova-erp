
package com.example.technova_erp.report;

import java.math.BigDecimal;
import java.util.List;

public record SalesReportResponse(
        long totalOrders,
        BigDecimal totalRevenue,
        List<SalesReportItemResponse> orders
) {
}

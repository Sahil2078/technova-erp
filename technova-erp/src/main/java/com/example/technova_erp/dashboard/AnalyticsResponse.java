
package com.example.technova_erp.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record AnalyticsResponse(
        BigDecimal totalSalesRevenue,
        BigDecimal totalPurchaseExpenses,
        List<MonthlySalesResponse> monthlySales,
        List<RecentOrderResponse> recentSalesOrders,
        List<RecentOrderResponse> recentPurchaseOrders
) {
}

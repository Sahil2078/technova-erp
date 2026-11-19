
package com.example.technova_erp.dashboard;

public record   DashboardResponse(
        long totalProducts,
        long totalCustomers,
        long totalSuppliers,
        long lowStockProducts,
        long totalPurchaseOrders,
        long totalSalesOrders
) {
}

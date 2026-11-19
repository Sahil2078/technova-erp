
package com.example.technova_erp.dashboard;

import com.example.technova_erp.PurchaseOrder;
import com.example.technova_erp.PurchaseOrderRepository;
import com.example.technova_erp.PurchaseOrderStatus;
import com.example.technova_erp.SalesOrder;
import com.example.technova_erp.SalesOrderRepository;
import com.example.technova_erp.SalesOrderStatus;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardAnalyticsService {

    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public DashboardAnalyticsService(
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository) {

        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {

        BigDecimal totalSalesRevenue = zeroIfNull(
                salesOrderRepository.sumTotalByStatus(
                        SalesOrderStatus.CONFIRMED
                )
        );

        BigDecimal totalPurchaseExpenses = zeroIfNull(
                purchaseOrderRepository.sumTotalByStatus(
                        PurchaseOrderStatus.RECEIVED
                )
        );

        List<MonthlySalesResponse> monthlySales =
                getMonthlySales();

        List<RecentOrderResponse> recentSalesOrders =
                getRecentSalesOrders();

        List<RecentOrderResponse> recentPurchaseOrders =
                getRecentPurchaseOrders();

        return new AnalyticsResponse(
                totalSalesRevenue,
                totalPurchaseExpenses,
                monthlySales,
                recentSalesOrders,
                recentPurchaseOrders
        );
    }

    private List<MonthlySalesResponse> getMonthlySales() {

        List<MonthlySalesResponse> result =
                new ArrayList<>();

        YearMonth currentMonth =
                YearMonth.from(LocalDate.now());

        for (int i = 5; i >= 0; i--) {

            YearMonth month = currentMonth.minusMonths(i);

            LocalDateTime startDate =
                    month.atDay(1).atStartOfDay();

            LocalDateTime endDate =
                    month.plusMonths(1)
                            .atDay(1)
                            .atStartOfDay();

            BigDecimal revenue = zeroIfNull(
                    salesOrderRepository
                            .sumConfirmedRevenueBetween(
                                    SalesOrderStatus.CONFIRMED,
                                    startDate,
                                    endDate
                            )
            );

            result.add(
                    new MonthlySalesResponse(
                            month.toString(),
                            revenue
                    )
            );
        }

        return result;
    }

    private List<RecentOrderResponse> getRecentSalesOrders() {

        List<SalesOrder> orders =
                salesOrderRepository
                        .findByOrderByCreatedAtDescIdDesc(
                                PageRequest.of(0, 5)
                        );

        return orders.stream()
                .map(order -> new RecentOrderResponse(
                        order.getId(),
                        "SALE",
                        order.getStatus().name(),
                        order.getTotalAmount(),
                        order.getCreatedAt()
                ))
                .toList();
    }

    private List<RecentOrderResponse> getRecentPurchaseOrders() {

        List<PurchaseOrder> orders =
                purchaseOrderRepository
                        .findByOrderByCreatedAtDescIdDesc(
                                PageRequest.of(0, 5)
                        );

        return orders.stream()
                .map(order -> new RecentOrderResponse(
                        order.getId(),
                        "PURCHASE",
                        order.getStatus().name(),
                        order.getTotalAmount(),
                        order.getCreatedAt()
                ))
                .toList();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

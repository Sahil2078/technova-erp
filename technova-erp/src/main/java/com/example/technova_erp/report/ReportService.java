
package com.example.technova_erp.report;

import com.example.technova_erp.SalesOrder;
import com.example.technova_erp.SalesOrderStatus;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportService {

    private final SalesOrderReportRepository repository;

    public ReportService(
            SalesOrderReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesReport(
            LocalDate from,
            LocalDate to) {

        if (from.isAfter(to)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "'from' date cannot be after 'to' date"
            );
        }

        LocalDateTime startDate = from.atStartOfDay();
        LocalDateTime endDate = to.plusDays(1).atStartOfDay();

        List<SalesOrder> salesOrders =
                repository.findSalesReportBetween(
                        startDate,
                        endDate
                );

        BigDecimal totalRevenue = salesOrders.stream()
                .filter(order ->
                        order.getStatus() == SalesOrderStatus.CONFIRMED)
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SalesReportItemResponse> orders =
                salesOrders.stream()
                        .map(order -> new SalesReportItemResponse(
                                order.getId(),
                                order.getCustomer().getName(),
                                order.getStatus().name(),
                                order.getTotalAmount(),
                                order.getCreatedAt()
                        ))
                        .toList();

        return new SalesReportResponse(
                salesOrders.size(),
                totalRevenue,
                orders
        );
    }
}

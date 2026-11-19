
package com.example.technova_erp.report;

import com.example.technova_erp.PurchaseOrder;
import com.example.technova_erp.PurchaseOrderStatus;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseReportService {

    private final PurchaseOrderReportRepository repository;

    public PurchaseReportService(
            PurchaseOrderReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PurchaseReportResponse getPurchaseReport(
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

        List<PurchaseOrder> purchaseOrders =
                repository.findPurchaseReportBetween(
                        startDate,
                        endDate
                );

        BigDecimal totalExpenses = purchaseOrders.stream()
                .filter(order ->
                        order.getStatus() == PurchaseOrderStatus.RECEIVED)
                .map(PurchaseOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PurchaseReportItemResponse> orders =
                purchaseOrders.stream()
                        .map(order -> new PurchaseReportItemResponse(
                                order.getId(),
                                order.getSupplier().getId(),
                                order.getStatus().name(),
                                order.getTotalAmount(),
                                order.getCreatedAt(),
                                order.getReceivedAt()
                        ))
                        .toList();

        return new PurchaseReportResponse(
                purchaseOrders.size(),
                totalExpenses,
                orders
        );
    }
}

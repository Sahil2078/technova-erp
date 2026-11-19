
package com.example.technova_erp.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;
    private final PurchaseReportService purchaseReportService;

    public ReportController(
            ReportService reportService,
            PurchaseReportService purchaseReportService) {

        this.reportService = reportService;
        this.purchaseReportService = purchaseReportService;
    }

    @GetMapping("/sales")
    public SalesReportResponse getSalesReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return reportService.getSalesReport(from, to);
    }

    @GetMapping("/purchases")
    public PurchaseReportResponse getPurchaseReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return purchaseReportService.getPurchaseReport(from, to);
    }
}


package com.example.technova_erp;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales-orders")
public class SalesOrderController {

    private final SalesOrderService service;

    public SalesOrderController(SalesOrderService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalesOrder createOrder(
            @Valid @RequestBody SalesOrderRequest request) {
        return service.createOrder(request);
    }

    @GetMapping
    public List<SalesOrder> getAllOrders() {
        return service.getAllOrders();
    }

    @GetMapping("/{id}")
    public SalesOrder getOrderById(@PathVariable Long id) {
        return service.getOrderById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<SalesOrder> getByCustomer(
            @PathVariable Long customerId) {
        return service.getOrdersByCustomer(customerId);
    }

    @GetMapping("/status/{status}")
    public List<SalesOrder> getByStatus(
            @PathVariable SalesOrderStatus status) {
        return service.getOrdersByStatus(status);
    }

    @PatchMapping("/{id}/confirm")
    public SalesOrder confirmOrder(@PathVariable Long id) {
        return service.confirmOrder(id);
    }

    @PatchMapping("/{id}/cancel")
    public SalesOrder cancelOrder(@PathVariable Long id) {
        return service.cancelOrder(id);
    }
}

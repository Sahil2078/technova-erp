
package com.example.technova_erp;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrder createOrder(
            @Valid @RequestBody PurchaseOrderRequest request) {

        return service.createOrder(request);
    }

    @GetMapping
    public List<PurchaseOrder> getAllOrders() {
        return service.getAllOrders();
    }

    @GetMapping("/{id}")
    public PurchaseOrder getOrderById(@PathVariable Long id) {
        return service.getOrderById(id);
    }

    @GetMapping("/supplier/{supplierId}")
    public List<PurchaseOrder> getBySupplier(
            @PathVariable Long supplierId) {

        return service.getBySupplier(supplierId);
    }

    @GetMapping("/status/{status}")
    public List<PurchaseOrder> getByStatus(
            @PathVariable PurchaseOrderStatus status) {

        return service.getByStatus(status);
    }

    @PatchMapping("/{id}/receive")
    public PurchaseOrder receiveOrder(@PathVariable Long id) {
        return service.receiveOrder(id);
    }
}
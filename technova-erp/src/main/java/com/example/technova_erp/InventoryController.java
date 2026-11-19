
package com.example.technova_erp;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Inventory createInventory(
            @Valid @RequestBody InventoryRequest request) {

        return service.createInventory(request);
    }

    @GetMapping
    public List<Inventory> getAllInventory() {
        return service.getAllInventory();
    }

    @GetMapping("/low-stock")
    public List<Inventory> getLowStock() {
        return service.getLowStock();
    }

    @GetMapping("/supplier/{supplierId}")
    public List<Inventory> getBySupplier(
            @PathVariable Long supplierId) {

        return service.getBySupplier(supplierId);
    }

    @GetMapping("/{id}")
    public Inventory getInventoryById(@PathVariable Long id) {
        return service.getInventoryById(id);
    }

    @PutMapping("/{id}")
    public Inventory updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRequest request) {

        return service.updateInventory(id, request);
    }

    @PatchMapping("/{id}/stock")
    public Inventory adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody StockAdjustmentRequest request) {

        return service.adjustStock(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInventory(@PathVariable Long id) {
        service.deleteInventory(id);
    }
}
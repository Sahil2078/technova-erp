
package com.example.technova_erp;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public class PurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    @Positive
    private Long supplierId;

    @NotEmpty(message = "At least one item is required")
    private List<@Valid PurchaseOrderItemRequest> items;

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public List<PurchaseOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderItemRequest> items) {
        this.items = items;
    }
}
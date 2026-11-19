
package com.example.technova_erp;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public class SalesOrderRequest {

    @NotNull
    private Long customerId;

    @NotEmpty
    private List<@Valid SalesOrderItemRequest> items;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public List<SalesOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SalesOrderItemRequest> items) {
        this.items = items;
    }
}

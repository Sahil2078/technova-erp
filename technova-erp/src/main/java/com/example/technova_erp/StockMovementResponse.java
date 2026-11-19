
package com.example.technova_erp;

import java.time.LocalDateTime;

public record StockMovementResponse(
        Long id,
        Long productId,
        String productName,
        String sku,
        Integer quantityChange,
        Long purchaseOrderId,
        Long salesOrderId,
        LocalDateTime createdAt
) {
}

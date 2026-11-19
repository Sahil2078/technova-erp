
package com.example.technova_erp.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RecentOrderResponse(
        Long id,
        String orderType,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt
) {
}

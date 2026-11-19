
package com.example.technova_erp.dashboard;

import java.math.BigDecimal;

public record MonthlySalesResponse(
        String month,
        BigDecimal revenue
) {
}

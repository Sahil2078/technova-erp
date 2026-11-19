
package com.example.technova_erp.dashboard;

import com.example.technova_erp.ProductRepository;
import com.example.technova_erp.CustomerRepository;
import com.example.technova_erp.SupplierRepository;
import com.example.technova_erp.InventoryRepository;
import com.example.technova_erp.PurchaseOrderRepository;
import com.example.technova_erp.SalesOrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;

    public DashboardService(
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository,
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SalesOrderRepository salesOrderRepository) {

        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getSummary() {

        long totalProducts = productRepository.count();

        long totalCustomers = customerRepository.count();

        long totalSuppliers = supplierRepository.count();

        long lowStockProducts = inventoryRepository.countLowStock();

        long totalPurchaseOrders = purchaseOrderRepository.count();

        long totalSalesOrders = salesOrderRepository.count();

        return new DashboardResponse(
                totalProducts,
                totalCustomers,
                totalSuppliers,
                lowStockProducts,
                totalPurchaseOrders,
                totalSalesOrders
        );
    }
}

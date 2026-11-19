
package com.example.technova_erp;

import com.example.technova_erp.exception.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository movementRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository orderRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            StockMovementRepository movementRepository) {

        this.orderRepository = orderRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public PurchaseOrder createOrder(PurchaseOrderRequest request) {

        Supplier supplier = supplierRepository
                .findById(request.getSupplierId())
                .orElseThrow(() -> new SupplierNotFoundException(
                        "Supplier not found with ID: " + request.getSupplierId()
                ));

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);

        BigDecimal total = BigDecimal.ZERO;

        for (PurchaseOrderItemRequest itemRequest : request.getItems()) {

            Product product = productRepository
                    .findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(
                            "Product not found with ID: "
                                    + itemRequest.getProductId()
                    ));

            PurchaseOrderItem item = new PurchaseOrderItem();

            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice());

            BigDecimal lineTotal = itemRequest.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            item.setLineTotal(lineTotal);

            order.addItem(item);
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new PurchaseOrderException(
                        "Purchase order not found with ID: " + id,
                        HttpStatus.NOT_FOUND
                ));
    }

    @Transactional
    public PurchaseOrder receiveOrder(Long id) {

        PurchaseOrder order = getOrderById(id);

        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new PurchaseOrderException(
                    "Purchase order already received",
                    HttpStatus.CONFLICT
            );
        }

        for (PurchaseOrderItem item : order.getItems()) {

            Inventory inventory = inventoryRepository
                    .findByProductId(item.getProduct().getId())
                    .orElseThrow(() -> new PurchaseOrderException(
                            "Inventory missing for product ID: "
                                    + item.getProduct().getId(),
                            HttpStatus.BAD_REQUEST
                    ));

            int newQuantity;

            try {
                newQuantity = Math.addExact(
                        inventory.getQuantity(),
                        item.getQuantity()
                );
            } catch (ArithmeticException ex) {
                throw new PurchaseOrderException(
                        "Stock quantity exceeds allowed limit",
                        HttpStatus.BAD_REQUEST
                );
            }

            inventory.setQuantity(newQuantity);
            inventoryRepository.save(inventory);

            StockMovement movement = new StockMovement();
            movement.setProduct(item.getProduct());
            movement.setPurchaseOrder(order);
            movement.setQuantityChange(item.getQuantity());

            movementRepository.save(movement);
        }

        order.setStatus(PurchaseOrderStatus.RECEIVED);
        order.setReceivedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getBySupplier(Long supplierId) {
        return orderRepository.findBySupplierId(supplierId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getByStatus(PurchaseOrderStatus status) {
        return orderRepository.findByStatus(status);
    }
}
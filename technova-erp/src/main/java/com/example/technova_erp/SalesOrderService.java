
package com.example.technova_erp;

import com.example.technova_erp.exception.SalesOrderException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SalesOrderService {

    private final SalesOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository movementRepository;

    public SalesOrderService(
            SalesOrderRepository orderRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            StockMovementRepository movementRepository) {

        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
    }

    // ==============================
    // 1. CREATE SALES ORDER
    // ==============================

    @Transactional
    public SalesOrder createOrder(SalesOrderRequest request) {

        Customer customer = customerRepository
                .findById(request.getCustomerId())
                .orElseThrow(() -> new SalesOrderException(
                        "Customer not found with ID: "
                                + request.getCustomerId(),
                        HttpStatus.NOT_FOUND
                ));

        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> productIds = new HashSet<>();

        for (SalesOrderItemRequest itemRequest : request.getItems()) {

            if (!productIds.add(itemRequest.getProductId())) {
                throw new SalesOrderException(
                        "Duplicate product in sales order: "
                                + itemRequest.getProductId(),
                        HttpStatus.BAD_REQUEST
                );
            }

            Product product = productRepository
                    .findById(itemRequest.getProductId())
                    .orElseThrow(() -> new SalesOrderException(
                            "Product not found with ID: "
                                    + itemRequest.getProductId(),
                            HttpStatus.NOT_FOUND
                    ));

            SalesOrderItem item = new SalesOrderItem();

            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice());

            BigDecimal lineTotal = itemRequest.getUnitPrice()
                    .multiply(
                            BigDecimal.valueOf(
                                    itemRequest.getQuantity()
                            )
                    );

            item.setLineTotal(lineTotal);

            order.addItem(item);
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total);
        order.setStatus(SalesOrderStatus.CREATED);

        return orderRepository.save(order);
    }

    // ==============================
    // 2. GET ALL SALES ORDERS
    // ==============================

    @Transactional(readOnly = true)
    public List<SalesOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    // ==============================
    // 3. GET SALES ORDER BY ID
    // ==============================

    @Transactional(readOnly = true)
    public SalesOrder getOrderById(Long id) {

        return orderRepository.findById(id)
                .orElseThrow(() -> new SalesOrderException(
                        "Sales order not found with ID: " + id,
                        HttpStatus.NOT_FOUND
                ));
    }

    // ==============================
    // 4. GET ORDERS BY CUSTOMER
    // ==============================

    @Transactional(readOnly = true)
    public List<SalesOrder> getOrdersByCustomer(Long customerId) {

        return orderRepository.findByCustomerId(customerId);
    }

    // ==============================
    // 5. GET ORDERS BY STATUS
    // ==============================

    @Transactional(readOnly = true)
    public List<SalesOrder> getOrdersByStatus(
            SalesOrderStatus status) {

        return orderRepository.findByStatus(status);
    }

    // ==============================
    // 6. CONFIRM SALES ORDER
    // ==============================

    @Transactional
    public SalesOrder confirmOrder(Long id) {

        SalesOrder order = getOrderById(id);

        // Only CREATED orders can be confirmed.
        if (order.getStatus() != SalesOrderStatus.CREATED) {
            throw new SalesOrderException(
                    "Only CREATED sales orders can be confirmed",
                    HttpStatus.CONFLICT
            );
        }

        // Step 1: Validate inventory for all items.
        for (SalesOrderItem item : order.getItems()) {

            Inventory inventory = inventoryRepository
                    .findByProductId(item.getProduct().getId())
                    .orElseThrow(() -> new SalesOrderException(
                            "Inventory not found for product ID: "
                                    + item.getProduct().getId(),
                            HttpStatus.NOT_FOUND
                    ));

            if (inventory.getQuantity() < item.getQuantity()) {
                throw new SalesOrderException(
                        "Insufficient stock for product ID: "
                                + item.getProduct().getId(),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Step 2: Deduct stock and save movement history.
        for (SalesOrderItem item : order.getItems()) {

            Inventory inventory = inventoryRepository
                    .findByProductId(item.getProduct().getId())
                    .orElseThrow(() -> new SalesOrderException(
                            "Inventory not found for product ID: "
                                    + item.getProduct().getId(),
                            HttpStatus.NOT_FOUND
                    ));

            inventory.setQuantity(
                    inventory.getQuantity() - item.getQuantity()
            );

            inventoryRepository.save(inventory);

            StockMovement movement = new StockMovement();

            movement.setProduct(item.getProduct());
            movement.setSalesOrder(order);
            movement.setQuantityChange(-item.getQuantity());

            movementRepository.save(movement);
        }

        // Step 3: Update order status.
        order.setStatus(SalesOrderStatus.CONFIRMED);
        order.setConfirmedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    // ==============================
    // 7. CANCEL SALES ORDER
    // ==============================

    @Transactional
    public SalesOrder cancelOrder(Long id) {

        SalesOrder order = getOrderById(id);

        // Prevent duplicate cancellation.
        if (order.getStatus() == SalesOrderStatus.CANCELLED) {
            throw new SalesOrderException(
                    "Sales order already cancelled",
                    HttpStatus.CONFLICT
            );
        }

        // CREATED orders have not deducted inventory.
        // Therefore, no stock restoration is needed.

        // CONFIRMED orders must restore inventory.
        if (order.getStatus() == SalesOrderStatus.CONFIRMED) {

            for (SalesOrderItem item : order.getItems()) {

                Inventory inventory = inventoryRepository
                        .findByProductId(item.getProduct().getId())
                        .orElseThrow(() -> new SalesOrderException(
                                "Inventory missing for product ID: "
                                        + item.getProduct().getId(),
                                HttpStatus.BAD_REQUEST
                        ));

                int restoredQuantity;

                try {
                    restoredQuantity = Math.addExact(
                            inventory.getQuantity(),
                            item.getQuantity()
                    );
                } catch (ArithmeticException ex) {
                    throw new SalesOrderException(
                            "Stock quantity exceeds allowed limit",
                            HttpStatus.BAD_REQUEST
                    );
                }

                inventory.setQuantity(restoredQuantity);

                inventoryRepository.save(inventory);

                // Record stock restoration.
                StockMovement movement = new StockMovement();

                movement.setProduct(item.getProduct());
                movement.setSalesOrder(order);
                movement.setQuantityChange(item.getQuantity());

                movementRepository.save(movement);
            }
        }

        // Update order status.
        order.setStatus(SalesOrderStatus.CANCELLED);

        return orderRepository.save(order);
    }
}

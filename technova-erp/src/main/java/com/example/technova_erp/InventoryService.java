
package com.example.technova_erp;

import com.example.technova_erp.exception.InventoryException;
import com.example.technova_erp.exception.ProductNotFoundException;
import com.example.technova_erp.exception.SupplierNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            SupplierRepository supplierRepository) {

        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }

    @Transactional
    public Inventory createInventory(InventoryRequest request) {

        if (inventoryRepository.existsByProductId(request.getProductId())) {
            throw new InventoryException(
                    "Inventory already exists for this product",
                    HttpStatus.CONFLICT
            );
        }

        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with ID: " + request.getProductId()
                ));

        Inventory inventory = new Inventory();

        inventory.setProduct(product);
        inventory.setSupplier(resolveSupplier(request.getSupplierId()));
        inventory.setQuantity(request.getQuantity());
        inventory.setMinimumStock(request.getMinimumStock());

        return inventoryRepository.save(inventory);
    }

    @Transactional(readOnly = true)
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Inventory getInventoryById(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new InventoryException(
                        "Inventory not found with ID: " + id,
                        HttpStatus.NOT_FOUND
                ));
    }

    @Transactional(readOnly = true)
    public List<Inventory> getLowStock() {
        return inventoryRepository.findLowStock();
    }

    @Transactional(readOnly = true)
    public List<Inventory> getBySupplier(Long supplierId) {
        return inventoryRepository.findBySupplierId(supplierId);
    }

    @Transactional
    public Inventory updateInventory(
            Long id,
            InventoryRequest request) {

        Inventory inventory = getInventoryById(id);

        if (!inventory.getProduct().getId().equals(request.getProductId())) {
            throw new InventoryException(
                    "Product cannot be changed for existing inventory",
                    HttpStatus.BAD_REQUEST
            );
        }

        inventory.setSupplier(resolveSupplier(request.getSupplierId()));
        inventory.setQuantity(request.getQuantity());
        inventory.setMinimumStock(request.getMinimumStock());

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory adjustStock(
            Long id,
            StockAdjustmentRequest request) {

        Inventory inventory = getInventoryById(id);

        int currentQuantity = inventory.getQuantity();
        int adjustment = request.getQuantity();

        int newQuantity;

        if (request.getType()
                == StockAdjustmentRequest.AdjustmentType.INCREASE) {

            try {
                newQuantity = Math.addExact(currentQuantity, adjustment);
            } catch (ArithmeticException ex) {
                throw new InventoryException(
                        "Stock quantity exceeds allowed limit",
                        HttpStatus.BAD_REQUEST
                );
            }

        } else {

            if (currentQuantity < adjustment) {
                throw new InventoryException(
                        "Insufficient stock. Available: " + currentQuantity,
                        HttpStatus.BAD_REQUEST
                );
            }

            newQuantity = currentQuantity - adjustment;
        }

        inventory.setQuantity(newQuantity);

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public void deleteInventory(Long id) {
        Inventory inventory = getInventoryById(id);
        inventoryRepository.delete(inventory);
    }

    private Supplier resolveSupplier(Long supplierId) {

        if (supplierId == null) {
            return null;
        }

        return supplierRepository.findById(supplierId)
                .orElseThrow(() -> new SupplierNotFoundException(
                        "Supplier not found with ID: " + supplierId
                ));
    }
}
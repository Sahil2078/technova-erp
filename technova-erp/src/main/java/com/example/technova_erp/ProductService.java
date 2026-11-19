
package com.example.technova_erp;

import com.example.technova_erp.exception.DuplicateSkuException;
import com.example.technova_erp.exception.ProductNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Product addProduct(Product product) {

        if (repository.findBySku(product.getSku()).isPresent()) {
            throw new DuplicateSkuException(
                    "Product with SKU " + product.getSku() + " already exists"
            );
        }

        return repository.save(product);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with ID: " + id
                        )
                );
    }

    @Transactional
    public Product updateProduct(Long id, Product updatedProduct) {

        Product existingProduct = getProductById(id);

        repository.findBySku(updatedProduct.getSku())
                .filter(product -> !product.getId().equals(id))
                .ifPresent(product -> {
                    throw new DuplicateSkuException(
                            "Product with SKU " + updatedProduct.getSku()
                                    + " already exists"
                    );
                });

        existingProduct.setSku(updatedProduct.getSku());
        existingProduct.setName(updatedProduct.getName());
        existingProduct.setBrand(updatedProduct.getBrand());
        existingProduct.setPrice(updatedProduct.getPrice());

        return repository.save(existingProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {

        Product product = getProductById(id);

        repository.delete(product);
    }
}

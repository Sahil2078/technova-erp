
package com.example.technova_erp;

import com.example.technova_erp.exception.SupplierNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository repository;

    public SupplierService(SupplierRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Supplier addSupplier(Supplier supplier) {

        if (repository.findByEmail(supplier.getEmail()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Supplier email already exists"
            );
        }

        return repository.save(supplier);
    }

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Supplier getSupplierById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new SupplierNotFoundException(
                                "Supplier not found with ID: " + id
                        )
                );
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier updatedSupplier) {

        Supplier existing = getSupplierById(id);

        repository.findByEmail(updatedSupplier.getEmail())
                .filter(s -> !s.getId().equals(id))
                .ifPresent(s -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Supplier email already exists"
                    );
                });

        existing.setName(updatedSupplier.getName());
        existing.setContactPerson(updatedSupplier.getContactPerson());
        existing.setEmail(updatedSupplier.getEmail());
        existing.setPhone(updatedSupplier.getPhone());
        existing.setAddress(updatedSupplier.getAddress());

        return repository.save(existing);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        repository.delete(supplier);
    }
}

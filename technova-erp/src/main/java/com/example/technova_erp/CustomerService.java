
package com.example.technova_erp;

import com.example.technova_erp.exception.CustomerException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Customer addCustomer(Customer customer) {

        if (repository.findByEmail(customer.getEmail()).isPresent()) {
            throw new CustomerException(
                    "Customer email already exists",
                    HttpStatus.CONFLICT
            );
        }

        return repository.save(customer);
    }

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new CustomerException(
                        "Customer not found with ID: " + id,
                        HttpStatus.NOT_FOUND
                ));
    }

    @Transactional
    public Customer updateCustomer(Long id, Customer updatedCustomer) {

        Customer existing = getCustomerById(id);

        repository.findByEmail(updatedCustomer.getEmail())
                .filter(c -> !c.getId().equals(id))
                .ifPresent(c -> {
                    throw new CustomerException(
                            "Customer email already exists",
                            HttpStatus.CONFLICT
                    );
                });

        existing.setName(updatedCustomer.getName());
        existing.setEmail(updatedCustomer.getEmail());
        existing.setPhone(updatedCustomer.getPhone());
        existing.setAddress(updatedCustomer.getAddress());

        return repository.save(existing);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);
        repository.delete(customer);
    }
}

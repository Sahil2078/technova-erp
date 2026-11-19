
package com.example.technova_erp.exception;

import org.springframework.http.HttpStatus;

public class PurchaseOrderException extends RuntimeException {

    private final HttpStatus status;

    public PurchaseOrderException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
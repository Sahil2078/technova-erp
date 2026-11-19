
package com.example.technova_erp.exception;

import org.springframework.http.HttpStatus;

public class CustomerException extends RuntimeException {

    private final HttpStatus status;

    public CustomerException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

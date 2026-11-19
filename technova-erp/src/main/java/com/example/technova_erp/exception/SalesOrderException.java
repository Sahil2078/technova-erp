
package com.example.technova_erp.exception;

import org.springframework.http.HttpStatus;

public class SalesOrderException extends RuntimeException {

    private final HttpStatus status;

    public SalesOrderException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

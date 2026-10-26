package org.divyesh.panchasara.energyforecastapi.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception,
            HttpServletRequest request) {

        return build(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpRequestMethodNotSupportedException.class
    })
    public ResponseEntity<ApiErrorResponse> handleClientError(
            Exception exception,
            HttpServletRequest request) {

        if (exception instanceof HttpRequestMethodNotSupportedException) {
            return build(
                    HttpStatus.METHOD_NOT_ALLOWED,
                    "HTTP method is not supported for this endpoint",
                    request
            );
        }

        if (exception instanceof MissingServletRequestParameterException missing) {
            return build(
                    HttpStatus.BAD_REQUEST,
                    "Missing required parameter: " + missing.getParameterName(),
                    request
            );
        }

        if (exception instanceof MethodArgumentTypeMismatchException mismatch) {
            return build(
                    HttpStatus.BAD_REQUEST,
                    "Invalid value for parameter: " + mismatch.getName(),
                    request
            );
        }

        return build(HttpStatus.BAD_REQUEST, null, request);
    }

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status,
            String message,
            HttpServletRequest request) {

        String resolvedMessage = message == null || message.isBlank()
                ? status.getReasonPhrase()
                : message;

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                resolvedMessage,
                request.getRequestURI()
        );

        return ResponseEntity.status(status).body(body);
    }
}

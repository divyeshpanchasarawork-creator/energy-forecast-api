package org.divyesh.panchasara.energyforecastapi.controller;

import java.time.Instant;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {}

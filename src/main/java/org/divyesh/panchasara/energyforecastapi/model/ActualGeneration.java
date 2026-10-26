package org.divyesh.panchasara.energyforecastapi.model;

import java.time.Instant;
import java.time.LocalDate;

public record ActualGeneration(
        String dataset,
        Instant publishTime,
        Instant startTime,
        LocalDate settlementDate,
        Integer settlementPeriod,
        String fuelType,
        double generation
) {}
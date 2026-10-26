package org.divyesh.panchasara.energyforecastapi.model;

import java.time.Instant;

public record ForecastComparison(
        Instant deliveryTime,
        double forecastGeneration,
        double actualGeneration,
        double error,
        double absoluteError
) {}

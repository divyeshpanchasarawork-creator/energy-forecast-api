package org.divyesh.panchasara.energyforecastapi.model;

import java.time.Instant;

public record WindForecast(
        String dataset,
        Instant publishTime,
        Instant startTime,
        double generation
) {}

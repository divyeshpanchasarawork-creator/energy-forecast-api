package org.divyesh.panchasara.energyforecastapi.model;

public record AccuracyMetrics(
        int matchedPeriods,
        double mae,
        double rmse,
        double meanBiasError
) {}

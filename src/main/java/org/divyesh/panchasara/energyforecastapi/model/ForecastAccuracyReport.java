package org.divyesh.panchasara.energyforecastapi.model;

import java.util.List;

public record ForecastAccuracyReport(
        int matchedPeriods,
        double mae,
        double rmse,
        double meanBiasError,
        List<ForecastComparison> comparisons,
        int expectedPeriods,
        double coveragePercent
) {}
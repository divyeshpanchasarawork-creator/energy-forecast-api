package org.divyesh.panchasara.energyforecastapi.service;

import org.divyesh.panchasara.energyforecastapi.model.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ForecastAccuracyService {

    public ForecastAccuracyReport calculate(
            List<WindForecast> forecasts,
            List<ActualGeneration> actuals,
            Instant deliveryFrom,
            Instant deliveryTo) {

        if (!deliveryTo.isAfter(deliveryFrom)) {
            throw new IllegalArgumentException(
                    "deliveryTo must be after deliveryFrom"
            );
        }

        // Expected number of hourly delivery periods.
        long hours = ChronoUnit.HOURS.between(
                deliveryFrom, deliveryTo
        );

        if (deliveryFrom.plus(hours, ChronoUnit.HOURS)
                .isBefore(deliveryTo)) {
            throw new IllegalArgumentException(
                    "Delivery window must contain whole hours"
            );
        }

        int expectedPeriods = Math.toIntExact(hours);

        // Keep the latest published actual per half-hour.
        Map<Instant, ActualGeneration> latestActuals =
                new HashMap<>();

        for (ActualGeneration actual : actuals) {
            Instant time = actual.startTime();

            if (time.isBefore(deliveryFrom)
                    || !time.isBefore(deliveryTo)) {
                continue;
            }

            ActualGeneration existing = latestActuals.get(time);

            if (existing == null
                    || actual.publishTime()
                    .isAfter(existing.publishTime())) {
                latestActuals.put(time, actual);
            }
        }

        // Group half-hour observations by delivery hour.
        Map<Instant, List<Double>> hourlyValues =
                new TreeMap<>();

        for (ActualGeneration actual : latestActuals.values()) {
            Instant hour = actual.startTime()
                    .truncatedTo(ChronoUnit.HOURS);

            hourlyValues.computeIfAbsent(
                    hour, ignored -> new ArrayList<>()
            ).add(actual.generation());
        }

        Map<Instant, Double> hourlyActuals = new HashMap<>();

        for (var entry : hourlyValues.entrySet()) {
            List<Double> values = entry.getValue();

            // Require both half-hour observations.
            if (values.size() == 2) {
                double average =
                        (values.get(0) + values.get(1)) / 2.0;

                hourlyActuals.put(entry.getKey(), average);
            }
        }

        // Map forecasts by delivery hour.
        Map<Instant, WindForecast> forecastByHour =
                new HashMap<>();

        for (WindForecast forecast : forecasts) {
            Instant time = forecast.startTime();

            if (!time.isBefore(deliveryFrom)
                    && time.isBefore(deliveryTo)) {

                WindForecast existing = forecastByHour.get(time);

                if (existing == null
                        || forecast.publishTime()
                        .isAfter(existing.publishTime())) {
                    forecastByHour.put(time, forecast);
                }
            }
        }

        forecastByHour.keySet().stream()
                .filter(hour -> !hourlyActuals.containsKey(hour))
                .sorted()
                .forEach(System.out::println);

        List<ForecastComparison> comparisons =
                new ArrayList<>();

        double absoluteErrorSum = 0.0;
        double squaredErrorSum = 0.0;
        double signedErrorSum = 0.0;

        for (var entry : hourlyActuals.entrySet()) {
            Instant hour = entry.getKey();
            WindForecast forecast = forecastByHour.get(hour);

            if (forecast == null) {
                continue;
            }

            double actual = entry.getValue();
            double predicted = forecast.generation();
            double error = actual - predicted;

            comparisons.add(new ForecastComparison(
                    hour,
                    predicted,
                    actual,
                    error,
                    Math.abs(error)
            ));

            absoluteErrorSum += Math.abs(error);
            squaredErrorSum += error * error;
            signedErrorSum += error;
        }

        comparisons.sort(
                Comparator.comparing(
                        ForecastComparison::deliveryTime
                )
        );

        int matched = comparisons.size();

        double coveragePercent = expectedPeriods == 0
                ? 0.0
                : 100.0 * matched / expectedPeriods;

        if (matched == 0) {
            return new ForecastAccuracyReport(
                    0,
                    0.0,
                    0.0,
                    0.0,
                    comparisons,
                    expectedPeriods,
                    coveragePercent
            );
        }

        return new ForecastAccuracyReport(
                matched,
                absoluteErrorSum / matched,
                Math.sqrt(squaredErrorSum / matched),
                signedErrorSum / matched,
                comparisons,
                expectedPeriods,
                coveragePercent
        );
    }
}

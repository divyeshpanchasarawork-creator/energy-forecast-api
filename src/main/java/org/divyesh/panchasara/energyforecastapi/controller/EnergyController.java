package org.divyesh.panchasara.energyforecastapi.controller;

import org.divyesh.panchasara.energyforecastapi.client.ActualGenerationClient;
import org.divyesh.panchasara.energyforecastapi.client.WindForecastClient;
import org.divyesh.panchasara.energyforecastapi.model.ActualGeneration;
import org.divyesh.panchasara.energyforecastapi.model.ForecastAccuracyReport;
import org.divyesh.panchasara.energyforecastapi.model.WindForecast;
import org.divyesh.panchasara.energyforecastapi.service.ForecastAccuracyService;
import org.divyesh.panchasara.energyforecastapi.service.ForecastSelectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/energy")
public class EnergyController {

    private final WindForecastClient forecastClient;
    private final ForecastSelectionService forecastSelectionService;
    private final ActualGenerationClient actualClient;
    private final ForecastAccuracyService accuracyService;

    public EnergyController(
            WindForecastClient forecastClient,
            ForecastSelectionService forecastSelectionService,
            ActualGenerationClient actualClient,
            ForecastAccuracyService accuracyService) {
        this.forecastClient = forecastClient;
        this.forecastSelectionService = forecastSelectionService;
        this.actualClient = actualClient;
        this.accuracyService = accuracyService;
    }


    @GetMapping("/forecast/selected")
    public List<WindForecast> getSelectedForecasts(
            @RequestParam Instant publishFrom,
            @RequestParam Instant decisionTime,
            @RequestParam Instant deliveryFrom,
            @RequestParam Instant deliveryTo) {

        if (publishFrom.isAfter(decisionTime)) {
            throw new IllegalArgumentException(
                    "publishFrom must not be after decisionTime");
        }

        if (deliveryFrom.isAfter(deliveryTo)) {
            throw new IllegalArgumentException(
                    "deliveryFrom must not be after deliveryTo");
        }

        List<WindForecast> forecasts =
                forecastClient.fetchWindForecast(
                        publishFrom,
                        decisionTime
                );

        return forecastSelectionService
                .selectLatestForecasts(forecasts, decisionTime)
                .stream()
                .filter(forecast ->
                        !forecast.startTime().isBefore(deliveryFrom))
                .filter(forecast ->
                        forecast.startTime().isBefore(deliveryTo))
                .toList();
    }

    @GetMapping("/accuracy")
    public ForecastAccuracyReport getForecastAccuracy(
            @RequestParam Instant publishFrom,
            @RequestParam Instant decisionTime,
            @RequestParam Instant deliveryFrom,
            @RequestParam Instant deliveryTo) {

        // Keep your existing validation and data-fetching code.

        var forecasts = forecastClient.fetchWindForecast(
                publishFrom, decisionTime
        );

        var selectedForecasts =
                forecastSelectionService.selectLatestForecasts(
                        forecasts, decisionTime
                );

        List<ActualGeneration> actuals = new ArrayList<>();

        LocalDate startDate = deliveryFrom
                .atZone(ZoneOffset.UTC)
                .toLocalDate();

        LocalDate endDate = deliveryTo
                .minusNanos(1)
                .atZone(ZoneOffset.UTC)
                .toLocalDate();

        for (LocalDate date = startDate;
             !date.isAfter(endDate);
             date = date.plusDays(1)) {

            actuals.addAll(actualClient.fetchActualGenerationByDate(date));
        }

        actuals = actuals.stream()
                .filter(actual ->
                        !actual.startTime().isBefore(deliveryFrom)
                                && actual.startTime().isBefore(deliveryTo))
                .toList();


        return accuracyService.calculate(
                selectedForecasts,
                actuals,
                deliveryFrom,
                deliveryTo
        );
    }

}

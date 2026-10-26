
package org.divyesh.panchasara.energyforecastapi.service;

import org.divyesh.panchasara.energyforecastapi.model.WindForecast;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ForecastSelectionServiceTest {

    private final ForecastSelectionService service =
            new ForecastSelectionService();

    @Test
    void selectsLatestForecastPublishedBeforeDecisionTime() {
        Instant delivery = Instant.parse("2026-01-15T12:00:00Z");
        Instant decision = Instant.parse("2026-01-15T10:00:00Z");

        List<WindForecast> forecasts = List.of(
                new WindForecast(
                        "WINDFOR",
                        Instant.parse("2026-01-15T08:00:00Z"),
                        delivery,
                        100.0
                ),
                new WindForecast(
                        "WINDFOR",
                        Instant.parse("2026-01-15T09:30:00Z"),
                        delivery,
                        120.0
                ),
                new WindForecast(
                        "WINDFOR",
                        Instant.parse("2026-01-15T10:30:00Z"),
                        delivery,
                        150.0
                )
        );

        List<WindForecast> selected =
                service.selectLatestForecasts(forecasts, decision);

        assertEquals(1, selected.size());
        assertEquals(
                Instant.parse("2026-01-15T09:30:00Z"),
                selected.get(0).publishTime()
        );
        assertEquals(120.0, selected.get(0).generation());
    }
}

package org.divyesh.panchasara.energyforecastapi.service;

import org.divyesh.panchasara.energyforecastapi.model.WindForecast;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ForecastSelectionService {

    public List<WindForecast> selectLatestForecasts(List<WindForecast> forecasts, Instant decisionTime) {
        Map<Instant, WindForecast> latestByDeliveryTime = new HashMap<>();

        for (WindForecast forecast : forecasts) {
            if (forecast.publishTime().isAfter(decisionTime)) {
                continue;
            }

            Instant deliveryTime = forecast.startTime();

            WindForecast existing = latestByDeliveryTime.get(deliveryTime);

            if (existing == null ||
                    forecast.publishTime().isAfter(existing.publishTime())) {

                latestByDeliveryTime.put(deliveryTime, forecast);
            }
        }

        List<WindForecast> selected = new ArrayList<>(latestByDeliveryTime.values());

        selected.sort(Comparator.comparing(WindForecast::startTime));

        return selected;
    }
}

package org.divyesh.panchasara.energyforecastapi.client;

import org.divyesh.panchasara.energyforecastapi.model.WindForecast;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

@Component
public class WindForecastClient {

    private final RestClient restClient;

    public WindForecastClient(RestClient bmrsRestClient) {
        this.restClient = bmrsRestClient;
    }

    public List<WindForecast> fetchWindForecast(
            Instant publishFrom,
            Instant publishTo) {

        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/datasets/WINDFOR/stream")
                        .queryParam("publishDateTimeFrom", publishFrom)
                        .queryParam("publishDateTimeTo", publishTo)
                        .build())
                .retrieve()
                .body(new ParameterizedTypeReference<
                        List<WindForecast>>() {});
    }
}

package org.divyesh.panchasara.energyforecastapi.client;

import org.divyesh.panchasara.energyforecastapi.model.ActualGeneration;
import org.divyesh.panchasara.energyforecastapi.model.BmrsDataResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

@Component
public class ActualGenerationClient {

    private final RestClient restClient;

    public ActualGenerationClient(RestClient bmrsRestClient) {
        this.restClient = bmrsRestClient;
    }

    public List<ActualGeneration> fetchActualGenerationByDate(
            LocalDate date) {

        BmrsDataResponse<ActualGeneration> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/datasets/FUELHH")
                        .queryParam("settlementDateFrom", date)
                        .queryParam("settlementDateTo", date)
                        .queryParam("fuelType", "WIND")
                        .build())
                .retrieve()
                .body(new ParameterizedTypeReference<
                        BmrsDataResponse<ActualGeneration>>() {});

        return response == null || response.data() == null
                ? List.of()
                : response.data();
    }
}
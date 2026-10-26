package org.divyesh.panchasara.energyforecastapi.controller;

import org.divyesh.panchasara.energyforecastapi.client.ActualGenerationClient;
import org.divyesh.panchasara.energyforecastapi.client.WindForecastClient;
import org.divyesh.panchasara.energyforecastapi.model.WindForecast;
import org.divyesh.panchasara.energyforecastapi.service.ForecastAccuracyService;
import org.divyesh.panchasara.energyforecastapi.service.ForecastSelectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EnergyControllerTest {

    private WindForecastClient forecastClient;
    private ForecastSelectionService forecastSelectionService;
    private ActualGenerationClient actualClient;
    private ForecastAccuracyService accuracyService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        forecastClient = mock(WindForecastClient.class);
        forecastSelectionService = mock(ForecastSelectionService.class);
        actualClient = mock(ActualGenerationClient.class);
        accuracyService = mock(ForecastAccuracyService.class);

        EnergyController controller = new EnergyController(
                forecastClient,
                forecastSelectionService,
                actualClient,
                accuracyService
        );

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void rejectsPublicationWindowWherePublishFromIsAfterDecisionTime()
            throws Exception {

        mockMvc.perform(get("/api/energy/forecast/selected")
                        .param("publishFrom", "2026-10-19T09:00:00Z")
                        .param("decisionTime", "2026-10-19T08:50:00Z")
                        .param("deliveryFrom", "2026-10-19T23:00:00Z")
                        .param("deliveryTo", "2026-10-20T23:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value(
                        "publishFrom must not be after decisionTime"))
                .andExpect(jsonPath("$.path").value(
                        "/api/energy/forecast/selected"));

        verifyNoInteractions(forecastClient, forecastSelectionService);
    }

    @Test
    void rejectsEmptyOrReversedDeliveryWindow() throws Exception {
        mockMvc.perform(get("/api/energy/forecast/selected")
                        .param("publishFrom", "2026-10-17T08:50:00Z")
                        .param("decisionTime", "2026-10-19T08:50:00Z")
                        .param("deliveryFrom", "2026-10-20T23:00:00Z")
                        .param("deliveryTo", "2026-10-19T23:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(
                        "deliveryFrom must be before deliveryTo"));

        verifyNoInteractions(forecastClient, forecastSelectionService);
    }

    @Test
    void rejectsAccuracyWindowOnPublicationValidation() throws Exception {
        mockMvc.perform(get("/api/energy/accuracy")
                        .param("publishFrom", "2026-10-19T09:00:00Z")
                        .param("decisionTime", "2026-10-19T08:50:00Z")
                        .param("deliveryFrom", "2026-10-19T23:00:00Z")
                        .param("deliveryTo", "2026-10-20T23:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "publishFrom must not be after decisionTime"));

        verifyNoInteractions(
                forecastClient,
                forecastSelectionService,
                actualClient,
                accuracyService
        );
    }

    @Test
    void rejectsAccuracyWindowContainingPartialHours() throws Exception {
        mockMvc.perform(get("/api/energy/accuracy")
                        .param("publishFrom", "2026-10-17T08:50:00Z")
                        .param("decisionTime", "2026-10-19T08:50:00Z")
                        .param("deliveryFrom", "2026-10-19T00:00:00Z")
                        .param("deliveryTo", "2026-10-19T01:30:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Delivery window must contain whole hours"));

        verifyNoInteractions(
                forecastClient,
                forecastSelectionService,
                actualClient,
                accuracyService
        );
    }

    @Test
    void rejectsMissingRequiredParameter() throws Exception {
        mockMvc.perform(get("/api/energy/forecast/selected")
                        .param("publishFrom", "2026-10-17T08:50:00Z")
                        .param("deliveryFrom", "2026-10-19T23:00:00Z")
                        .param("deliveryTo", "2026-10-20T23:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(
                        "Missing required parameter: decisionTime"));

        verifyNoInteractions(forecastClient, forecastSelectionService);
    }

    @Test
    void rejectsMalformedTimestamp() throws Exception {
        mockMvc.perform(get("/api/energy/forecast/selected")
                        .param("publishFrom", "2026-10-17T08:50:00Z")
                        .param("decisionTime", "not-a-timestamp")
                        .param("deliveryFrom", "2026-10-19T23:00:00Z")
                        .param("deliveryTo", "2026-10-20T23:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(
                        "Invalid value for parameter: decisionTime"));

        verifyNoInteractions(forecastClient, forecastSelectionService);
    }

    @Test
    void rejectsUnsupportedMethod() throws Exception {
        mockMvc.perform(post("/api/energy/forecast/selected"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"));
    }

    @Test
    void returnsSelectedForecastsForValidRequest() throws Exception {
        Instant publishFrom = Instant.parse("2026-10-17T08:50:00Z");
        Instant decisionTime = Instant.parse("2026-10-19T08:50:00Z");
        WindForecast forecast = new WindForecast(
                "WINDFOR",
                Instant.parse("2026-10-19T08:30:00Z"),
                Instant.parse("2026-10-19T23:00:00Z"),
                12520.0
        );

        given(forecastClient.fetchWindForecast(publishFrom, decisionTime))
                .willReturn(List.of(forecast));
        given(forecastSelectionService.selectLatestForecasts(
                List.of(forecast),
                decisionTime
        )).willReturn(List.of(forecast));

        mockMvc.perform(get("/api/energy/forecast/selected")
                        .param("publishFrom", publishFrom.toString())
                        .param("decisionTime", decisionTime.toString())
                        .param("deliveryFrom", "2026-10-19T23:00:00Z")
                        .param("deliveryTo", "2026-10-20T23:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dataset").value("WINDFOR"))
                .andExpect(jsonPath("$[0].publishTime").value(
                        "2026-10-19T08:30:00Z"))
                .andExpect(jsonPath("$[0].startTime").value(
                        "2026-10-19T23:00:00Z"))
                .andExpect(jsonPath("$[0].generation").value(12520.0));
    }
}

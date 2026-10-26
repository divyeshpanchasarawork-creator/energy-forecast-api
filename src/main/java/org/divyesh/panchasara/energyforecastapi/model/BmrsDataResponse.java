package org.divyesh.panchasara.energyforecastapi.model;

import java.util.List;

public record BmrsDataResponse<T>(
        List<T> data
) {}

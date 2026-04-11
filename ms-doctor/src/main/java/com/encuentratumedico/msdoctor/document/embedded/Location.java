package com.encuentratumedico.msdoctor.document.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {

    private String city;
    private String address;
    private Double latitude;
    private Double longitude;

    /**
     * GeoJSON Point for geospatial queries.
     * IMPORTANT: MongoDB uses [longitude, latitude] order.
     * Use: new GeoJsonPoint(longitude, latitude)
     */
    private GeoJsonPoint coordinates;
}

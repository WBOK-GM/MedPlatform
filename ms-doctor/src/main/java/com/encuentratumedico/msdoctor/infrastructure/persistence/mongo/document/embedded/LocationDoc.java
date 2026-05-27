package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDoc {
    private String city;
    private String address;
    private Double latitude;
    private Double longitude;
    private GeoJsonPoint coordinates;
}

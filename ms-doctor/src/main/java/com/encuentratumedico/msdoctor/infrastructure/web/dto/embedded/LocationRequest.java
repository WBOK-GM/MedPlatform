package com.encuentratumedico.msdoctor.infrastructure.web.dto.embedded;

import lombok.Data;

@Data
public class LocationRequest {
    private String city;
    private String address;
    private Double latitude;
    private Double longitude;
}

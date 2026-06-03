package com.encuentratumedico.msdoctor.infrastructure.web.dto.embedded;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Ubicación del consultorio del médico")
public class LocationRequest {

    @Schema(description = "Ciudad donde se encuentra el consultorio", example = "Bogotá")
    private String city;

    @Schema(description = "Dirección del consultorio", example = "Cra. 7 #123-45, Consultorio 301")
    private String address;

    @Schema(description = "Latitud geográfica", example = "4.6097")
    private Double latitude;

    @Schema(description = "Longitud geográfica", example = "-74.0817")
    private Double longitude;
}

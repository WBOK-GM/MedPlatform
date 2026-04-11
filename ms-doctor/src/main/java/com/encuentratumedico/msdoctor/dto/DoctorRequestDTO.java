package com.encuentratumedico.msdoctor.dto;

import com.encuentratumedico.msdoctor.document.embedded.Location;
import com.encuentratumedico.msdoctor.enums.CareType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class DoctorRequestDTO {

    @NotBlank(message = "El userId es obligatorio")
    private String userId;

    @NotBlank(message = "El nombre es obligatorio")
    private String name;
    
    private String email;
    private String phoneNumber;
    private String profileImageUrl;

    @NotBlank(message = "La especialidad es obligatoria")
    private String specialization;

    @NotNull(message = "Los años de experiencia son obligatorios")
    @PositiveOrZero(message = "Los años de experiencia no pueden ser negativos")
    private Integer experienceYears;

    @NotBlank(message = "La descripción profesional es obligatoria")
    private String professionalDescription;

    @NotNull(message = "La modalidad de atención es obligatoria")
    private CareType careType;

    @NotNull(message = "La ubicación es obligatoria")
    private Location location;
}

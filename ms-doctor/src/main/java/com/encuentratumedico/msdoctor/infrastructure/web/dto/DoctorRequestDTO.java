package com.encuentratumedico.msdoctor.infrastructure.web.dto;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.embedded.LocationRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
@Schema(description = "Datos para crear o actualizar el perfil de un médico")
public class DoctorRequestDTO {

    @Schema(description = "UUID del usuario en ms-auth. Vincula el perfil médico con la cuenta de autenticación", example = "f47ac10b-58cc-4372-a567-0e02b2c3d479")
    @NotBlank(message = "El userId es obligatorio")
    private String userId;

    @Schema(description = "Nombre completo del médico", example = "Dr. Carlos Rodríguez")
    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    @Schema(description = "Correo electrónico de contacto profesional", example = "dr.rodriguez@clinica.com")
    private String email;

    @Schema(description = "Número de teléfono de contacto", example = "+57 300 123 4567")
    private String phoneNumber;

    @Schema(description = "URL de la foto de perfil principal", example = "https://cdn.ejemplo.com/foto.jpg")
    private String profileImageUrl;

    @Schema(description = "Especialidad médica", example = "Cardiología")
    @NotBlank(message = "La especialidad es obligatoria")
    private String specialization;

    @Schema(description = "Años de experiencia profesional (≥ 0)", example = "10")
    @NotNull(message = "Los años de experiencia son obligatorios")
    @PositiveOrZero(message = "Los años de experiencia no pueden ser negativos")
    private Integer experienceYears;

    @Schema(description = "Descripción profesional del médico visible en su perfil", example = "Especialista en cardiología intervencionista con más de 10 años de experiencia.")
    @NotBlank(message = "La descripción profesional es obligatoria")
    private String professionalDescription;

    @Schema(description = "Modalidad de atención: IN_PERSON, VIRTUAL o HYBRID", example = "VIRTUAL")
    @NotNull(message = "La modalidad de atención es obligatoria")
    private CareType careType;

    @Schema(description = "Ubicación del consultorio")
    @NotNull(message = "La ubicación es obligatoria")
    private LocationRequest location;
}

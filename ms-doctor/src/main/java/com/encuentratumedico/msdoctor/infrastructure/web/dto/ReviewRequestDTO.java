package com.encuentratumedico.msdoctor.infrastructure.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Datos para enviar una calificación y reseña de un médico")
public class ReviewRequestDTO {

    @Schema(description = "UUID del paciente que emite la reseña", example = "a1b2c3d4-1234-5678-abcd-ef0123456789")
    @NotBlank(message = "El ID del paciente es obligatorio")
    private String patientId;

    @Schema(description = "Nombre visible del paciente en la reseña", example = "Juan Pérez")
    @NotBlank(message = "El nombre del paciente es obligatorio")
    private String patientName;

    @Schema(description = "UUID de la cita que originó la reseña", example = "cita-uuid-1234")
    @NotBlank(message = "El ID de la cita es obligatorio")
    private String appointmentId;

    @Schema(description = "Calificación del médico de 1 (muy malo) a 5 (excelente)", example = "5")
    @NotNull(message = "La calificación es obligatoria")
    @Min(value = 1, message = "La calificación mínima es 1")
    @Max(value = 5, message = "La calificación máxima es 5")
    private Integer rating;

    @Schema(description = "Comentario libre del paciente sobre la consulta", example = "Excelente atención, muy profesional.")
    private String comment;
}

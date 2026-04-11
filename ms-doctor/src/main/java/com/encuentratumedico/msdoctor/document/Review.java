package com.encuentratumedico.msdoctor.document;

import com.encuentratumedico.msdoctor.enums.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * Colección de reseñas separada del perfil del médico.
 * Permite paginación y moderación (US-024, US-025, US-030).
 * La validación cruzada con ms-appointment se hace en ReviewService.
 */
@Document(collection = "reviews")
@CompoundIndex(name = "idx_no_duplicate_review",
        def = "{'appointment_id': 1, 'patient_id': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    private String id;

    @Field("doctor_id")
    private String doctorId;

    @Field("patient_id")
    private String patientId;

    @Field("patient_name")
    private String patientName;  // Copiado de ms-auth para mostrar en UI

    @Field("appointment_id")
    private String appointmentId;  // Ref a ms-appointment (validación cruzada)

    private Integer rating;       // 1 a 5

    private String comment;

    @Builder.Default
    private ReviewStatus status = ReviewStatus.ACTIVE;

    @Field("moderated_by")
    private String moderatedBy;    // userId del admin que moderó (US-030)

    @Field("moderated_at")
    private LocalDateTime moderatedAt;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;
}

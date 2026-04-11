package com.encuentratumedico.msdoctor.document;

import com.encuentratumedico.msdoctor.document.embedded.Image;
import com.encuentratumedico.msdoctor.document.embedded.Location;
import com.encuentratumedico.msdoctor.enums.CareType;
import com.encuentratumedico.msdoctor.enums.DoctorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Documento principal del médico en MongoDB.
 * Índice 2dsphere creado en MongoConfig sobre location.coordinates
 * para queries geoespaciales (US-009, US-013).
 */
@Document(collection = "doctors")
@CompoundIndex(name = "idx_user_id", def = "{'user_id': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    private String id;

    /**
     * UUID del usuario en ms-auth. Referencia externa.
     */
    @Field("user_id")
    private String userId;

    /**
     * Nombre del médico (copiado de ms-auth para evitar joins cross-service).
     */
    private String name;

    private String email;

    @Field("phone_number")
    private String phoneNumber;

    @Field("profile_image_url")
    private String profileImageUrl;

    // ---- Información profesional (US-007) ----
    private String specialization;

    @Field("experience_years")
    private Integer experienceYears;

    @Field("professional_description")
    private String professionalDescription;

    @Field("care_type")
    private CareType careType;

    // ---- Ubicación (US-009, US-013) ----
    private Location location;

    // ---- Galería de imágenes (US-008) ----
    @Builder.Default
    private List<Image> images = new ArrayList<>();

    // ---- Calificaciones (US-024, US-025) ----
    @Field("average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Field("review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    // ---- Estado y verificación (US-029) ----
    @Field("is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private DoctorStatus status = DoctorStatus.ACTIVE;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Field("updated_at")
    private LocalDateTime updatedAt;
}

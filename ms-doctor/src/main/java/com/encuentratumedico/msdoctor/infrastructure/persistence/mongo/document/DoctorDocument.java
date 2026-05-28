package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document;

import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded.ImageDoc;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded.LocationDoc;
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

@Document(collection = "doctors")
@CompoundIndex(name = "idx_user_id", def = "{'user_id': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDocument {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    private String name;

    private String email;

    @Field("phone_number")
    private String phoneNumber;

    @Field("profile_image_url")
    private String profileImageUrl;

    private String specialization;

    @Field("experience_years")
    private Integer experienceYears;

    @Field("professional_description")
    private String professionalDescription;

    @Field("care_type")
    private String careType;

    private LocationDoc location;

    @Builder.Default
    private List<ImageDoc> images = new ArrayList<>();

    @Field("average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Field("review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Field("is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private String status = "ACTIVE";

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Field("updated_at")
    private LocalDateTime updatedAt;
}

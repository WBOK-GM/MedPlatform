package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document;

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

@Document(collection = "reviews")
@CompoundIndex(name = "idx_no_duplicate_review",
        def = "{'appointment_id': 1, 'patient_id': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDocument {

    @Id
    private String id;

    @Field("doctor_id")
    private String doctorId;

    @Field("patient_id")
    private String patientId;

    @Field("patient_name")
    private String patientName;

    @Field("appointment_id")
    private String appointmentId;

    private Integer rating;

    private String comment;

    @Builder.Default
    private String status = "ACTIVE";

    @Field("moderated_by")
    private String moderatedBy;

    @Field("moderated_at")
    private LocalDateTime moderatedAt;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;
}

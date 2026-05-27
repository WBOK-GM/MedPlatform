package com.encuentratumedico.msdoctor.application.view;

import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewStatus;

import java.time.Instant;

public record ReviewView(
        String id,
        String doctorId,
        String patientId,
        String patientName,
        String appointmentId,
        Integer rating,
        String comment,
        ReviewStatus status,
        String moderatedBy,
        Instant moderatedAt,
        Instant createdAt) {

    public static ReviewView from(Review r) {
        return new ReviewView(
                r.id().value(),
                r.doctorId().value(),
                r.patientId().value(),
                r.patientName(),
                r.appointmentId(),
                r.rating().value(),
                r.comment(),
                r.status(),
                r.moderatedBy(),
                r.moderatedAt(),
                r.createdAt());
    }
}

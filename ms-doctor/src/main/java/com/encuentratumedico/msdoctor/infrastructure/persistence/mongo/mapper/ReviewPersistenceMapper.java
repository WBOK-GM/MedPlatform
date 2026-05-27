package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.mapper;

import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.review.RatingValue;
import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewId;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewStatus;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.ReviewDocument;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public final class ReviewPersistenceMapper {

    private ReviewPersistenceMapper() {
    }

    public static Review toDomain(ReviewDocument doc) {
        return Review.rehydrate(
                ReviewId.of(doc.getId()),
                DoctorId.of(doc.getDoctorId()),
                UserId.of(doc.getPatientId()),
                doc.getPatientName(),
                doc.getAppointmentId(),
                RatingValue.of(doc.getRating()),
                doc.getComment(),
                doc.getStatus() == null ? ReviewStatus.ACTIVE : ReviewStatus.valueOf(doc.getStatus()),
                doc.getModeratedBy(),
                doc.getModeratedAt() == null ? null : doc.getModeratedAt().toInstant(ZoneOffset.UTC),
                doc.getCreatedAt() == null ? null : doc.getCreatedAt().toInstant(ZoneOffset.UTC));
    }

    public static ReviewDocument toDocument(Review review, ReviewDocument existing) {
        ReviewDocument doc = existing == null ? new ReviewDocument() : existing;
        doc.setId(review.id().value());
        doc.setDoctorId(review.doctorId().value());
        doc.setPatientId(review.patientId().value());
        doc.setPatientName(review.patientName());
        doc.setAppointmentId(review.appointmentId());
        doc.setRating(review.rating().value());
        doc.setComment(review.comment());
        doc.setStatus(review.status().name());
        doc.setModeratedBy(review.moderatedBy());
        doc.setModeratedAt(review.moderatedAt() == null ? null : LocalDateTime.ofInstant(review.moderatedAt(), ZoneOffset.UTC));
        return doc;
    }
}

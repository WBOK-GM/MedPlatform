package com.encuentratumedico.msdoctor.domain.model.review;

import com.encuentratumedico.msdoctor.domain.event.ReviewModerated;
import com.encuentratumedico.msdoctor.domain.event.ReviewSubmitted;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.shared.domain.AggregateRoot;

import java.time.Instant;
import java.util.UUID;

public class Review extends AggregateRoot {

    private final ReviewId id;
    private final DoctorId doctorId;
    private final UserId patientId;
    private final String patientName;
    private final String appointmentId;
    private final RatingValue rating;
    private final String comment;
    private ReviewStatus status;
    private String moderatedBy;
    private Instant moderatedAt;
    private final Instant createdAt;

    private Review(ReviewId id, DoctorId doctorId, UserId patientId, String patientName,
                   String appointmentId, RatingValue rating, String comment,
                   ReviewStatus status, String moderatedBy, Instant moderatedAt,
                   Instant createdAt) {
        this.id = id;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.patientName = patientName;
        this.appointmentId = appointmentId;
        this.rating = rating;
        this.comment = comment;
        this.status = status == null ? ReviewStatus.ACTIVE : status;
        this.moderatedBy = moderatedBy;
        this.moderatedAt = moderatedAt;
        this.createdAt = createdAt;
    }

    public static Review submit(DoctorId doctorId, UserId patientId, String patientName,
                                String appointmentId, RatingValue rating, String comment) {
        if (patientName == null || patientName.isBlank()) {
            throw new IllegalArgumentException("Patient name cannot be empty");
        }
        if (appointmentId == null || appointmentId.isBlank()) {
            throw new IllegalArgumentException("Appointment id cannot be empty");
        }
        ReviewId id = new ReviewId(UUID.randomUUID().toString());
        Review review = new Review(id, doctorId, patientId, patientName.trim(), appointmentId.trim(),
                rating, comment, ReviewStatus.ACTIVE, null, null, Instant.now());
        review.record(new ReviewSubmitted(id.value(), doctorId.value(), patientId.value(), rating.value()));
        return review;
    }

    public static Review rehydrate(ReviewId id, DoctorId doctorId, UserId patientId, String patientName,
                                   String appointmentId, RatingValue rating, String comment,
                                   ReviewStatus status, String moderatedBy, Instant moderatedAt,
                                   Instant createdAt) {
        return new Review(id, doctorId, patientId, patientName, appointmentId, rating, comment,
                status, moderatedBy, moderatedAt, createdAt);
    }

    public void hide(String adminUserId) {
        if (adminUserId == null || adminUserId.isBlank()) {
            throw new IllegalArgumentException("Admin user id is required to moderate");
        }
        if (this.status == ReviewStatus.HIDDEN) {
            return;
        }
        this.status = ReviewStatus.HIDDEN;
        this.moderatedBy = adminUserId;
        this.moderatedAt = Instant.now();
        record(new ReviewModerated(id.value(), doctorId.value(), adminUserId, "HIDDEN"));
    }

    public ReviewId id() { return id; }
    public DoctorId doctorId() { return doctorId; }
    public UserId patientId() { return patientId; }
    public String patientName() { return patientName; }
    public String appointmentId() { return appointmentId; }
    public RatingValue rating() { return rating; }
    public String comment() { return comment; }
    public ReviewStatus status() { return status; }
    public String moderatedBy() { return moderatedBy; }
    public Instant moderatedAt() { return moderatedAt; }
    public Instant createdAt() { return createdAt; }
}

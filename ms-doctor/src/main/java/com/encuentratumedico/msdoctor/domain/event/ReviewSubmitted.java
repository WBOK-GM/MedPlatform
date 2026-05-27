package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record ReviewSubmitted(String reviewId, String doctorId, String patientId, int rating, Instant occurredAt) implements DomainEvent {
    public ReviewSubmitted(String reviewId, String doctorId, String patientId, int rating) {
        this(reviewId, doctorId, patientId, rating, Instant.now());
    }

    @Override
    public String eventName() {
        return "review.submitted";
    }
}

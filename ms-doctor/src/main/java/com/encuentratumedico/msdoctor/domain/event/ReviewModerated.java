package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record ReviewModerated(String reviewId, String doctorId, String adminUserId, String action, Instant occurredAt) implements DomainEvent {
    public ReviewModerated(String reviewId, String doctorId, String adminUserId, String action) {
        this(reviewId, doctorId, adminUserId, action, Instant.now());
    }

    @Override
    public String eventName() {
        return "review.moderated";
    }
}

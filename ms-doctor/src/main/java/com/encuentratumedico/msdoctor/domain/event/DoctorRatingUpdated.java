package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record DoctorRatingUpdated(String doctorId, double averageRating, int reviewCount, Instant occurredAt) implements DomainEvent {
    public DoctorRatingUpdated(String doctorId, double averageRating, int reviewCount) {
        this(doctorId, averageRating, reviewCount, Instant.now());
    }

    @Override
    public String eventName() {
        return "doctor.rating-updated";
    }
}

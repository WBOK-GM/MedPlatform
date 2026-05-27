package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record DoctorRegistered(String doctorId, String userId, String email, Instant occurredAt) implements DomainEvent {
    public DoctorRegistered(String doctorId, String userId, String email) {
        this(doctorId, userId, email, Instant.now());
    }

    @Override
    public String eventName() {
        return "doctor.registered";
    }
}

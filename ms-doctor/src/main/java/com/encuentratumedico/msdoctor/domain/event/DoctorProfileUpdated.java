package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record DoctorProfileUpdated(String doctorId, Instant occurredAt) implements DomainEvent {
    public DoctorProfileUpdated(String doctorId) {
        this(doctorId, Instant.now());
    }

    @Override
    public String eventName() {
        return "doctor.profile-updated";
    }
}

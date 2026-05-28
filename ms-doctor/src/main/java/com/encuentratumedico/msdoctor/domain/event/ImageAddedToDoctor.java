package com.encuentratumedico.msdoctor.domain.event;

import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;

import java.time.Instant;

public record ImageAddedToDoctor(String doctorId, String imageId, String url, Instant occurredAt) implements DomainEvent {
    public ImageAddedToDoctor(String doctorId, String imageId, String url) {
        this(doctorId, imageId, url, Instant.now());
    }

    @Override
    public String eventName() {
        return "doctor.image-added";
    }
}

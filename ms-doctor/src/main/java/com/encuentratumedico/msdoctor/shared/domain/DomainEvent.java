package com.encuentratumedico.msdoctor.shared.domain;

import java.time.Instant;

public interface DomainEvent {
    String eventName();

    Instant occurredAt();
}

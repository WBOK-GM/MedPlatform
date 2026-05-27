package com.encuentratumedico.msdoctor.shared.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public abstract class AggregateRoot {
    private final List<DomainEvent> events = new ArrayList<>();

    protected void record(DomainEvent event) {
        events.add(event);
    }

    public List<DomainEvent> pullEvents() {
        List<DomainEvent> copy = Collections.unmodifiableList(new ArrayList<>(events));
        events.clear();
        return copy;
    }
}

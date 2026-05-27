package com.encuentratumedico.msdoctor.infrastructure.messaging;

import com.encuentratumedico.msdoctor.domain.port.out.EventPublisherPort;
import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LoggingEventPublisher implements EventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger("DomainEvents");

    @Override
    public void publishAll(List<? extends DomainEvent> events) {
        if (events == null) return;
        for (DomainEvent event : events) {
            log.info("{} @ {} :: {}", event.eventName(), event.occurredAt(), event);
        }
    }
}

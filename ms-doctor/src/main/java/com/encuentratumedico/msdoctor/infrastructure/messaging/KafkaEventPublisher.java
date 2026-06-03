package com.encuentratumedico.msdoctor.infrastructure.messaging;

import com.encuentratumedico.msdoctor.domain.event.DoctorProfileUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRatingUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRegistered;
import com.encuentratumedico.msdoctor.domain.event.ImageAddedToDoctor;
import com.encuentratumedico.msdoctor.domain.event.ReviewModerated;
import com.encuentratumedico.msdoctor.domain.event.ReviewSubmitted;
import com.encuentratumedico.msdoctor.domain.port.out.EventPublisherPort;
import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Primary
@Component
public class KafkaEventPublisher implements EventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger("DomainEvents");
    private static final String TOPIC = "doctor-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper mapper;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper mapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.mapper = mapper;
    }

    @Override
    public void publishAll(List<? extends DomainEvent> events) {
        if (events == null) return;
        for (DomainEvent event : events) {
            try {
                String key = aggregateIdOf(event);
                @SuppressWarnings("unchecked")
                Map<String, Object> data = mapper.convertValue(event, Map.class);
                Map<String, Object> envelope = Map.of(
                    "eventName", event.eventName(),
                    "occurredAt", event.occurredAt().toString(),
                    "aggregateId", key,
                    "version", 1,
                    "data", data
                );
                String value = mapper.writeValueAsString(envelope);
                log.info("{} @ {} -> {} key={}", event.eventName(), event.occurredAt(), TOPIC, key);
                kafkaTemplate.send(TOPIC, key, value);
            } catch (Exception e) {
                log.error("Error publicando evento {}: {}", event.eventName(), e.getMessage(), e);
            }
        }
    }

    private String aggregateIdOf(DomainEvent event) {
        if (event instanceof DoctorRegistered e)      return e.doctorId();
        if (event instanceof DoctorProfileUpdated e)  return e.doctorId();
        if (event instanceof DoctorRatingUpdated e)   return e.doctorId();
        if (event instanceof ImageAddedToDoctor e)    return e.doctorId();
        if (event instanceof ReviewSubmitted e)       return e.doctorId();
        if (event instanceof ReviewModerated e)       return e.doctorId();
        return "unknown";
    }
}

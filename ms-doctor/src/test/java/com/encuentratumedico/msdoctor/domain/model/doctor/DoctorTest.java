package com.encuentratumedico.msdoctor.domain.model.doctor;

import com.encuentratumedico.msdoctor.domain.event.DoctorProfileUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRatingUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRegistered;
import com.encuentratumedico.msdoctor.domain.event.ImageAddedToDoctor;
import com.encuentratumedico.msdoctor.domain.model.shared.GeoPoint;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.shared.domain.DomainEvent;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DoctorTest {

    private Doctor newDoctor() {
        return Doctor.register(
                UserId.of("user-1"),
                "Dr Jane",
                null,
                null,
                null,
                "Cardiología",
                5,
                "Especialista en cardio",
                CareType.IN_PERSON,
                new Location("Bogotá", "Calle 1", new GeoPoint(4.7, -74.0)));
    }

    @Test
    void registerCreatesAggregateAndEmitsDoctorRegistered() {
        Doctor doctor = newDoctor();
        assertThat(doctor.id()).isNotNull();
        assertThat(doctor.status()).isEqualTo(DoctorStatus.ACTIVE);
        assertThat(doctor.rating().count()).isZero();

        List<DomainEvent> events = doctor.pullEvents();
        assertThat(events).hasSize(1);
        assertThat(events.get(0)).isInstanceOf(DoctorRegistered.class);
    }

    @Test
    void registerRejectsEmptyName() {
        assertThatThrownBy(() -> Doctor.register(
                UserId.of("u1"), " ", null, null, null,
                "Cardiología", 1, "desc", CareType.VIRTUAL,
                new Location("B", "Calle 1", null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void registerRejectsNegativeExperience() {
        assertThatThrownBy(() -> Doctor.register(
                UserId.of("u1"), "Dr", null, null, null,
                "Cardio", -1, "d", CareType.VIRTUAL,
                new Location("B", "C", null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateProfileEmitsDoctorProfileUpdated() {
        Doctor doctor = newDoctor();
        doctor.pullEvents();
        doctor.updateProfile("Dr Jane Updated", "Dermatología", 6, "Nueva desc",
                CareType.HYBRID, new Location("Medellín", "Cra 5", null));
        assertThat(doctor.name()).isEqualTo("Dr Jane Updated");
        assertThat(doctor.specialization()).isEqualTo("Dermatología");
        List<DomainEvent> events = doctor.pullEvents();
        assertThat(events).hasSize(1).first().isInstanceOf(DoctorProfileUpdated.class);
    }

    @Test
    void addImageAddsToGalleryAndEmitsImageAdded() {
        Doctor doctor = newDoctor();
        doctor.pullEvents();
        doctor.addImage("https://example.com/img.png", "title", "desc");
        assertThat(doctor.images().size()).isEqualTo(1);
        assertThat(doctor.pullEvents()).first().isInstanceOf(ImageAddedToDoctor.class);
    }

    @Test
    void updateRatingChangesRatingAndEmitsEvent() {
        Doctor doctor = newDoctor();
        doctor.pullEvents();
        doctor.updateRating(new Rating(4.5, 10));
        assertThat(doctor.rating().average()).isEqualTo(4.5);
        assertThat(doctor.rating().count()).isEqualTo(10);
        assertThat(doctor.pullEvents()).first().isInstanceOf(DoctorRatingUpdated.class);
    }
}

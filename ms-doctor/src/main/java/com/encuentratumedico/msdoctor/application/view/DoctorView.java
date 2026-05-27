package com.encuentratumedico.msdoctor.application.view;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.model.doctor.Doctor;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorStatus;
import com.encuentratumedico.msdoctor.domain.model.shared.Image;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;

import java.time.Instant;
import java.util.List;

public record DoctorView(
        String id,
        String userId,
        String name,
        String specialization,
        Integer experienceYears,
        String professionalDescription,
        CareType careType,
        Location location,
        List<Image> images,
        Double averageRating,
        Integer reviewCount,
        Boolean isVerified,
        DoctorStatus status,
        Instant createdAt) {

    public static DoctorView from(Doctor d) {
        return new DoctorView(
                d.id().value(),
                d.userId().value(),
                d.name(),
                d.specialization(),
                d.experienceYears(),
                d.professionalDescription(),
                d.careType(),
                d.location(),
                d.images().asList(),
                d.rating().average(),
                d.rating().count(),
                d.verified(),
                d.status(),
                d.createdAt());
    }
}

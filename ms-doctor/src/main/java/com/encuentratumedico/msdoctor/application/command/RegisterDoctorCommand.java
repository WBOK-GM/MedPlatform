package com.encuentratumedico.msdoctor.application.command;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;

public record RegisterDoctorCommand(
        String userId,
        String name,
        String email,
        String phoneNumber,
        String profileImageUrl,
        String specialization,
        Integer experienceYears,
        String professionalDescription,
        CareType careType,
        Location location) {
}

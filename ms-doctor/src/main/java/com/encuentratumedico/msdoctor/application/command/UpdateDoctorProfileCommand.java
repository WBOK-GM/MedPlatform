package com.encuentratumedico.msdoctor.application.command;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;

public record UpdateDoctorProfileCommand(
        String doctorId,
        String name,
        String specialization,
        Integer experienceYears,
        String professionalDescription,
        CareType careType,
        Location location) {
}

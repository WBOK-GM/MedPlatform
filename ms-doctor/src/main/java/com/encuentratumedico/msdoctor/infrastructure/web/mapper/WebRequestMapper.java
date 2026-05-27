package com.encuentratumedico.msdoctor.infrastructure.web.mapper;

import com.encuentratumedico.msdoctor.application.command.RegisterDoctorCommand;
import com.encuentratumedico.msdoctor.application.command.SubmitReviewCommand;
import com.encuentratumedico.msdoctor.application.command.UpdateDoctorProfileCommand;
import com.encuentratumedico.msdoctor.domain.model.shared.GeoPoint;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.DoctorRequestDTO;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.ReviewRequestDTO;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.embedded.LocationRequest;

public final class WebRequestMapper {

    private WebRequestMapper() {
    }

    public static Location toLocation(LocationRequest req) {
        if (req == null) return null;
        GeoPoint point = (req.getLatitude() != null && req.getLongitude() != null)
                ? new GeoPoint(req.getLatitude(), req.getLongitude())
                : null;
        return new Location(req.getCity(), req.getAddress(), point);
    }

    public static RegisterDoctorCommand toRegisterCommand(DoctorRequestDTO dto) {
        return new RegisterDoctorCommand(
                dto.getUserId(),
                dto.getName(),
                dto.getEmail(),
                dto.getPhoneNumber(),
                dto.getProfileImageUrl(),
                dto.getSpecialization(),
                dto.getExperienceYears(),
                dto.getProfessionalDescription(),
                dto.getCareType(),
                toLocation(dto.getLocation()));
    }

    public static UpdateDoctorProfileCommand toUpdateCommand(String doctorId, DoctorRequestDTO dto) {
        return new UpdateDoctorProfileCommand(
                doctorId,
                dto.getName(),
                dto.getSpecialization(),
                dto.getExperienceYears(),
                dto.getProfessionalDescription(),
                dto.getCareType(),
                toLocation(dto.getLocation()));
    }

    public static SubmitReviewCommand toSubmitReviewCommand(String doctorId, ReviewRequestDTO dto) {
        return new SubmitReviewCommand(
                doctorId,
                dto.getPatientId(),
                dto.getPatientName(),
                dto.getAppointmentId(),
                dto.getRating(),
                dto.getComment());
    }
}

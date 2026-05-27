package com.encuentratumedico.msdoctor.domain.model.doctor;

public record DoctorId(String value) {
    public DoctorId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("DoctorId cannot be empty");
        }
    }

    public static DoctorId of(String raw) {
        return new DoctorId(raw);
    }
}

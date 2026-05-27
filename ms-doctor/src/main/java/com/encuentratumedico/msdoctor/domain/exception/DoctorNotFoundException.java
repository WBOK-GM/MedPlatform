package com.encuentratumedico.msdoctor.domain.exception;

import com.encuentratumedico.msdoctor.shared.domain.DomainException;

public class DoctorNotFoundException extends DomainException {
    public DoctorNotFoundException(String field, String value) {
        super(String.format("Doctor no encontrado con %s: '%s'", field, value));
    }
}

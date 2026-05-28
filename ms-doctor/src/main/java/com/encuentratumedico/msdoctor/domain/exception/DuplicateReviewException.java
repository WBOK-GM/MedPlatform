package com.encuentratumedico.msdoctor.domain.exception;

import com.encuentratumedico.msdoctor.shared.domain.DomainException;

public class DuplicateReviewException extends DomainException {
    public DuplicateReviewException() {
        super("El paciente ya ha realizado una reseña para esta cita.");
    }
}

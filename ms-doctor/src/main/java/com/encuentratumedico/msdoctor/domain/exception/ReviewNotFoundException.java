package com.encuentratumedico.msdoctor.domain.exception;

import com.encuentratumedico.msdoctor.shared.domain.DomainException;

public class ReviewNotFoundException extends DomainException {
    public ReviewNotFoundException(String id) {
        super("Review no encontrada con id: '" + id + "'");
    }
}

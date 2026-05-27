package com.encuentratumedico.msdoctor.domain.exception;

import com.encuentratumedico.msdoctor.shared.domain.DomainException;

public class DoctorAlreadyExistsException extends DomainException {
    public DoctorAlreadyExistsException(String userId) {
        super("El usuario ya tiene un perfil médico asociado: " + userId);
    }
}

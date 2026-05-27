package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.view.DoctorView;

public interface GetDoctorByIdUseCase {
    DoctorView getById(String doctorId);
}

package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.command.UpdateDoctorProfileCommand;
import com.encuentratumedico.msdoctor.application.view.DoctorView;

public interface UpdateDoctorProfileUseCase {
    DoctorView updateProfile(UpdateDoctorProfileCommand command);
}

package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.command.RegisterDoctorCommand;
import com.encuentratumedico.msdoctor.application.view.DoctorView;

public interface RegisterDoctorUseCase {
    DoctorView register(RegisterDoctorCommand command);
}

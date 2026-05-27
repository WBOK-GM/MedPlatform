package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.command.UploadImageCommand;
import com.encuentratumedico.msdoctor.application.view.DoctorView;

public interface UploadImageUseCase {
    DoctorView uploadImage(UploadImageCommand command);
}

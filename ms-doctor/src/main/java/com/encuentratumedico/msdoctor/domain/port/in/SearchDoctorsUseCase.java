package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.query.SearchDoctorsQuery;
import com.encuentratumedico.msdoctor.application.view.DoctorView;
import org.springframework.data.domain.Page;

public interface SearchDoctorsUseCase {
    Page<DoctorView> search(SearchDoctorsQuery query);
}

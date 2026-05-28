package com.encuentratumedico.msdoctor.application.query;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import org.springframework.data.domain.Pageable;

public record SearchDoctorsQuery(String specialization, String city, CareType careType, Pageable pageable) {
}

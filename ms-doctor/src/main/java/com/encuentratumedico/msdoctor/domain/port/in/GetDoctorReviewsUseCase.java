package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.view.ReviewView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetDoctorReviewsUseCase {
    Page<ReviewView> getActiveReviews(String doctorId, Pageable pageable);
}

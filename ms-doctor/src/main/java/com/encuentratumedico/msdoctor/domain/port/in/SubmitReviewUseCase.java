package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.command.SubmitReviewCommand;
import com.encuentratumedico.msdoctor.application.view.ReviewView;

public interface SubmitReviewUseCase {
    ReviewView submit(SubmitReviewCommand command);
}

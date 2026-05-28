package com.encuentratumedico.msdoctor.domain.port.in;

import com.encuentratumedico.msdoctor.application.command.HideReviewCommand;
import com.encuentratumedico.msdoctor.application.view.ReviewView;

public interface HideReviewUseCase {
    ReviewView hide(HideReviewCommand command);
}

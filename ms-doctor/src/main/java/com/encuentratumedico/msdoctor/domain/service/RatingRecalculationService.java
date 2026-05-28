package com.encuentratumedico.msdoctor.domain.service;

import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;

import java.util.Collection;

public final class RatingRecalculationService {

    private RatingRecalculationService() {
    }

    public static Rating recalculate(Collection<Review> activeReviews) {
        if (activeReviews == null || activeReviews.isEmpty()) {
            return Rating.empty();
        }
        double sum = activeReviews.stream().mapToInt(r -> r.rating().value()).sum();
        return Rating.of(sum, activeReviews.size());
    }
}

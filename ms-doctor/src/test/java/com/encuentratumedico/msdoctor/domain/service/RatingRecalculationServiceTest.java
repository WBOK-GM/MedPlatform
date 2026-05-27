package com.encuentratumedico.msdoctor.domain.service;

import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.review.RatingValue;
import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RatingRecalculationServiceTest {

    @Test
    void emptyListReturnsEmptyRating() {
        Rating result = RatingRecalculationService.recalculate(List.of());
        assertThat(result.count()).isZero();
        assertThat(result.average()).isZero();
    }

    @Test
    void averageAndCountAreCalculatedCorrectly() {
        DoctorId did = DoctorId.of("d1");
        List<Review> reviews = List.of(
                Review.submit(did, UserId.of("p1"), "P1", "a1", RatingValue.of(5), null),
                Review.submit(did, UserId.of("p2"), "P2", "a2", RatingValue.of(4), null),
                Review.submit(did, UserId.of("p3"), "P3", "a3", RatingValue.of(3), null)
        );
        Rating result = RatingRecalculationService.recalculate(reviews);
        assertThat(result.count()).isEqualTo(3);
        assertThat(result.average()).isEqualTo(4.0);
    }
}

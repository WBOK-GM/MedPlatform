package com.encuentratumedico.msdoctor.domain.model.review;

import com.encuentratumedico.msdoctor.domain.event.ReviewModerated;
import com.encuentratumedico.msdoctor.domain.event.ReviewSubmitted;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReviewTest {

    @Test
    void submitCreatesActiveReviewAndEmitsReviewSubmitted() {
        Review review = Review.submit(DoctorId.of("d1"), UserId.of("p1"), "Patient", "app-1",
                RatingValue.of(5), "Excelente");
        assertThat(review.status()).isEqualTo(ReviewStatus.ACTIVE);
        assertThat(review.pullEvents()).hasSize(1).first().isInstanceOf(ReviewSubmitted.class);
    }

    @Test
    void submitRejectsEmptyPatientName() {
        assertThatThrownBy(() -> Review.submit(
                DoctorId.of("d1"), UserId.of("p1"), " ", "app-1",
                RatingValue.of(4), "ok"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void submitRejectsEmptyAppointmentId() {
        assertThatThrownBy(() -> Review.submit(
                DoctorId.of("d1"), UserId.of("p1"), "Patient", " ",
                RatingValue.of(4), "ok"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void hideMovesToHiddenAndEmitsReviewModerated() {
        Review review = Review.submit(DoctorId.of("d1"), UserId.of("p1"), "Patient", "app-1",
                RatingValue.of(3), null);
        review.pullEvents();
        review.hide("admin-1");
        assertThat(review.status()).isEqualTo(ReviewStatus.HIDDEN);
        assertThat(review.moderatedBy()).isEqualTo("admin-1");
        assertThat(review.pullEvents()).first().isInstanceOf(ReviewModerated.class);
    }

    @Test
    void hideIsIdempotentForAlreadyHidden() {
        Review review = Review.submit(DoctorId.of("d1"), UserId.of("p1"), "Patient", "app-1",
                RatingValue.of(3), null);
        review.hide("admin-1");
        review.pullEvents();
        review.hide("admin-2");
        // already hidden, no new event recorded
        assertThat(review.pullEvents()).isEmpty();
    }
}

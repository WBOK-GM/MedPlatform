package com.encuentratumedico.msdoctor.domain.model.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RatingTest {

    @Test
    void emptyReturnsZeroAverageAndCount() {
        Rating r = Rating.empty();
        assertThat(r.average()).isEqualTo(0.0);
        assertThat(r.count()).isEqualTo(0);
    }

    @Test
    void rejectsNegativeCount() {
        assertThatThrownBy(() -> new Rating(0.0, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsAverageOutOfRangeWhenCountPositive() {
        assertThatThrownBy(() -> new Rating(6.0, 1))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Rating(-0.5, 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void ofComputesAverageRoundedToOneDecimal() {
        Rating r = Rating.of(13, 3); // 4.333... -> 4.3
        assertThat(r.average()).isEqualTo(4.3);
        assertThat(r.count()).isEqualTo(3);
    }

    @Test
    void ofWithZeroCountReturnsEmpty() {
        Rating r = Rating.of(0, 0);
        assertThat(r.average()).isEqualTo(0.0);
        assertThat(r.count()).isEqualTo(0);
    }
}

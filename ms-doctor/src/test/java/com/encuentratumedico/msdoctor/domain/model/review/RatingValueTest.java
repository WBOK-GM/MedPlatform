package com.encuentratumedico.msdoctor.domain.model.review;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RatingValueTest {

    @Test
    void acceptsValuesBetween1And5() {
        assertThat(new RatingValue(1).value()).isEqualTo(1);
        assertThat(new RatingValue(5).value()).isEqualTo(5);
    }

    @Test
    void rejectsValueOutOfRange() {
        assertThatThrownBy(() -> new RatingValue(0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RatingValue(6))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

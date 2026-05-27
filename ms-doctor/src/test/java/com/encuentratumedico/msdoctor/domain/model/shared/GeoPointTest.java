package com.encuentratumedico.msdoctor.domain.model.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeoPointTest {

    @Test
    void acceptsValuesWithinRange() {
        new GeoPoint(0.0, 0.0);
        new GeoPoint(-90.0, -180.0);
        new GeoPoint(90.0, 180.0);
    }

    @Test
    void rejectsLatitudeOutOfRange() {
        assertThatThrownBy(() -> new GeoPoint(91.0, 0.0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new GeoPoint(-91.0, 0.0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsLongitudeOutOfRange() {
        assertThatThrownBy(() -> new GeoPoint(0.0, 181.0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new GeoPoint(0.0, -181.0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

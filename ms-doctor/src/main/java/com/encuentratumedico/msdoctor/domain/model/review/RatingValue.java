package com.encuentratumedico.msdoctor.domain.model.review;

public record RatingValue(int value) {
    public RatingValue {
        if (value < 1 || value > 5) {
            throw new IllegalArgumentException("Rating value must be between 1 and 5, got: " + value);
        }
    }

    public static RatingValue of(int value) {
        return new RatingValue(value);
    }
}

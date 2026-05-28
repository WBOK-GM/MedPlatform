package com.encuentratumedico.msdoctor.domain.model.review;

public record ReviewId(String value) {
    public ReviewId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("ReviewId cannot be empty");
        }
    }

    public static ReviewId of(String raw) {
        return new ReviewId(raw);
    }
}

package com.encuentratumedico.msdoctor.domain.model.shared;

public record UserId(String value) {
    public UserId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("UserId cannot be empty");
        }
        value = value.trim();
    }

    public static UserId of(String raw) {
        return new UserId(raw);
    }
}

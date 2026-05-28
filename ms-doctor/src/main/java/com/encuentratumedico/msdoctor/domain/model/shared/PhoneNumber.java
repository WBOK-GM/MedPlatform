package com.encuentratumedico.msdoctor.domain.model.shared;

public record PhoneNumber(String value) {
    public PhoneNumber {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }
        value = value.trim();
        if (value.length() < 7 || value.length() > 20) {
            throw new IllegalArgumentException("Phone number length out of range: " + value);
        }
    }

    public static PhoneNumber ofNullable(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return new PhoneNumber(raw);
    }
}

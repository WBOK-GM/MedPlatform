package com.encuentratumedico.msdoctor.domain.model.shared;

import java.util.regex.Pattern;

public record Email(String value) {
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    public Email {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        value = value.trim().toLowerCase();
        if (!EMAIL_REGEX.matcher(value).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + value);
        }
    }

    public static Email of(String raw) {
        return new Email(raw);
    }

    public static Email ofNullable(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return new Email(raw);
    }
}

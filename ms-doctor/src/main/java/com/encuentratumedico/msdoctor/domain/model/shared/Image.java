package com.encuentratumedico.msdoctor.domain.model.shared;

import java.time.Instant;
import java.util.UUID;

public record Image(
        String id,
        String url,
        String key,
        String title,
        String description,
        Instant uploadedAt) {
    public Image {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Image url cannot be empty");
        }
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (uploadedAt == null) {
            uploadedAt = Instant.now();
        }
    }

    public static Image newOne(String url, String title, String description) {
        return new Image(UUID.randomUUID().toString(), url, null, title, description, Instant.now());
    }
}

package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageDoc {
    private String id;
    private String url;
    private String key;
    private String title;
    private String description;
    private LocalDateTime uploadedAt;
}

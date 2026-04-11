package com.encuentratumedico.msdoctor.document.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Image {

    private String id;        // UUID generated manually
    private String url;       // URL externa (S3 / MinIO)
    private String key;       // Key en el bucket (para eliminar)
    private String title;
    private String description;
    private LocalDateTime uploadedAt;
}

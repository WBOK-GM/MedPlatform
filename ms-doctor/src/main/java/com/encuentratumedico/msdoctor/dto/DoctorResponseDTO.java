package com.encuentratumedico.msdoctor.dto;

import com.encuentratumedico.msdoctor.document.embedded.Image;
import com.encuentratumedico.msdoctor.document.embedded.Location;
import com.encuentratumedico.msdoctor.enums.CareType;
import com.encuentratumedico.msdoctor.enums.DoctorStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DoctorResponseDTO {
    private String id;
    private String userId;
    private String name;
    private String specialization;
    private Integer experienceYears;
    private String professionalDescription;
    private CareType careType;
    private Location location;
    private List<Image> images;
    private Double averageRating;
    private Integer reviewCount;
    private Boolean isVerified;
    private DoctorStatus status;
    private LocalDateTime createdAt;
}

package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.mapper;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.model.doctor.Doctor;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorStatus;
import com.encuentratumedico.msdoctor.domain.model.shared.Email;
import com.encuentratumedico.msdoctor.domain.model.shared.GeoPoint;
import com.encuentratumedico.msdoctor.domain.model.shared.Image;
import com.encuentratumedico.msdoctor.domain.model.shared.ImageGallery;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;
import com.encuentratumedico.msdoctor.domain.model.shared.PhoneNumber;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.DoctorDocument;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded.ImageDoc;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.embedded.LocationDoc;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

public final class DoctorPersistenceMapper {

    private DoctorPersistenceMapper() {
    }

    public static Doctor toDomain(DoctorDocument doc) {
        Location location = doc.getLocation() == null ? null : new Location(
                doc.getLocation().getCity(),
                doc.getLocation().getAddress(),
                doc.getLocation().getLatitude() != null && doc.getLocation().getLongitude() != null
                        ? new GeoPoint(doc.getLocation().getLatitude(), doc.getLocation().getLongitude())
                        : null);

        List<Image> images = doc.getImages() == null
                ? List.of()
                : doc.getImages().stream().map(i -> new Image(
                        i.getId(), i.getUrl(), i.getKey(), i.getTitle(), i.getDescription(),
                        i.getUploadedAt() == null ? Instant.now() : i.getUploadedAt().toInstant(ZoneOffset.UTC)
                )).collect(Collectors.toList());

        Rating rating = Rating.empty();
        if (doc.getReviewCount() != null && doc.getReviewCount() > 0) {
            rating = new Rating(doc.getAverageRating() == null ? 0.0 : doc.getAverageRating(), doc.getReviewCount());
        }

        return Doctor.rehydrate(
                DoctorId.of(doc.getId()),
                UserId.of(doc.getUserId()),
                doc.getName(),
                Email.ofNullable(doc.getEmail()),
                PhoneNumber.ofNullable(doc.getPhoneNumber()),
                doc.getProfileImageUrl(),
                doc.getSpecialization(),
                doc.getExperienceYears() == null ? 0 : doc.getExperienceYears(),
                doc.getProfessionalDescription(),
                doc.getCareType() == null ? CareType.IN_PERSON : CareType.valueOf(doc.getCareType()),
                location,
                ImageGallery.of(images),
                rating,
                Boolean.TRUE.equals(doc.getIsVerified()),
                doc.getStatus() == null ? DoctorStatus.ACTIVE : DoctorStatus.valueOf(doc.getStatus()),
                doc.getCreatedAt() == null ? null : doc.getCreatedAt().toInstant(ZoneOffset.UTC),
                doc.getUpdatedAt() == null ? null : doc.getUpdatedAt().toInstant(ZoneOffset.UTC));
    }

    public static DoctorDocument toDocument(Doctor doctor, DoctorDocument existing) {
        DoctorDocument doc = existing == null ? new DoctorDocument() : existing;
        doc.setId(doctor.id().value());
        doc.setUserId(doctor.userId().value());
        doc.setName(doctor.name());
        doc.setEmail(doctor.email() == null ? null : doctor.email().value());
        doc.setPhoneNumber(doctor.phoneNumber() == null ? null : doctor.phoneNumber().value());
        doc.setProfileImageUrl(doctor.profileImageUrl());
        doc.setSpecialization(doctor.specialization());
        doc.setExperienceYears(doctor.experienceYears());
        doc.setProfessionalDescription(doctor.professionalDescription());
        doc.setCareType(doctor.careType() == null ? null : doctor.careType().name());

        if (doctor.location() != null) {
            Location loc = doctor.location();
            doc.setLocation(LocationDoc.builder()
                    .city(loc.city())
                    .address(loc.address())
                    .latitude(loc.coordinates() == null ? null : loc.coordinates().latitude())
                    .longitude(loc.coordinates() == null ? null : loc.coordinates().longitude())
                    .coordinates(loc.coordinates() == null
                            ? null
                            : new GeoJsonPoint(loc.coordinates().longitude(), loc.coordinates().latitude()))
                    .build());
        }

        doc.setImages(doctor.images().asList().stream().map(i -> ImageDoc.builder()
                .id(i.id())
                .url(i.url())
                .key(i.key())
                .title(i.title())
                .description(i.description())
                .uploadedAt(i.uploadedAt() == null ? null : LocalDateTime.ofInstant(i.uploadedAt(), ZoneOffset.UTC))
                .build()).collect(Collectors.toList()));

        doc.setAverageRating(doctor.rating().average());
        doc.setReviewCount(doctor.rating().count());
        doc.setIsVerified(doctor.verified());
        doc.setStatus(doctor.status().name());
        return doc;
    }
}

package com.encuentratumedico.msdoctor.domain.model.doctor;

import com.encuentratumedico.msdoctor.domain.event.DoctorProfileUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRatingUpdated;
import com.encuentratumedico.msdoctor.domain.event.DoctorRegistered;
import com.encuentratumedico.msdoctor.domain.event.ImageAddedToDoctor;
import com.encuentratumedico.msdoctor.domain.model.shared.Email;
import com.encuentratumedico.msdoctor.domain.model.shared.Image;
import com.encuentratumedico.msdoctor.domain.model.shared.ImageGallery;
import com.encuentratumedico.msdoctor.domain.model.shared.Location;
import com.encuentratumedico.msdoctor.domain.model.shared.PhoneNumber;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.shared.domain.AggregateRoot;

import java.time.Instant;
import java.util.UUID;

public class Doctor extends AggregateRoot {

    private final DoctorId id;
    private final UserId userId;
    private String name;
    private Email email;
    private PhoneNumber phoneNumber;
    private String profileImageUrl;
    private String specialization;
    private int experienceYears;
    private String professionalDescription;
    private CareType careType;
    private Location location;
    private ImageGallery images;
    private Rating rating;
    private boolean verified;
    private DoctorStatus status;
    private final Instant createdAt;
    private Instant updatedAt;

    private Doctor(DoctorId id, UserId userId, String name, Email email,
                   PhoneNumber phoneNumber, String profileImageUrl,
                   String specialization, int experienceYears,
                   String professionalDescription, CareType careType,
                   Location location, ImageGallery images, Rating rating,
                   boolean verified, DoctorStatus status,
                   Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.profileImageUrl = profileImageUrl;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.professionalDescription = professionalDescription;
        this.careType = careType;
        this.location = location;
        this.images = images == null ? ImageGallery.empty() : images;
        this.rating = rating == null ? Rating.empty() : rating;
        this.verified = verified;
        this.status = status == null ? DoctorStatus.ACTIVE : status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Doctor register(UserId userId, String name, Email email, PhoneNumber phoneNumber,
                                  String profileImageUrl, String specialization, int experienceYears,
                                  String professionalDescription, CareType careType, Location location) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Doctor name cannot be empty");
        }
        if (specialization == null || specialization.isBlank()) {
            throw new IllegalArgumentException("Specialization cannot be empty");
        }
        if (experienceYears < 0) {
            throw new IllegalArgumentException("Experience years cannot be negative");
        }
        if (careType == null) {
            throw new IllegalArgumentException("CareType is required");
        }
        if (location == null) {
            throw new IllegalArgumentException("Location is required");
        }
        DoctorId id = new DoctorId(UUID.randomUUID().toString());
        Instant now = Instant.now();
        Doctor doctor = new Doctor(id, userId, name.trim(), email, phoneNumber, profileImageUrl,
                specialization.trim(), experienceYears, professionalDescription, careType, location,
                ImageGallery.empty(), Rating.empty(), false, DoctorStatus.ACTIVE, now, now);
        doctor.record(new DoctorRegistered(id.value(), userId.value(), email == null ? null : email.value()));
        return doctor;
    }

    public static Doctor rehydrate(DoctorId id, UserId userId, String name, Email email,
                                   PhoneNumber phoneNumber, String profileImageUrl,
                                   String specialization, int experienceYears,
                                   String professionalDescription, CareType careType,
                                   Location location, ImageGallery images, Rating rating,
                                   boolean verified, DoctorStatus status,
                                   Instant createdAt, Instant updatedAt) {
        return new Doctor(id, userId, name, email, phoneNumber, profileImageUrl, specialization,
                experienceYears, professionalDescription, careType, location, images, rating,
                verified, status, createdAt, updatedAt);
    }

    public void updateProfile(String name, String specialization, int experienceYears,
                              String professionalDescription, CareType careType, Location location) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Doctor name cannot be empty");
        }
        if (experienceYears < 0) {
            throw new IllegalArgumentException("Experience years cannot be negative");
        }
        if (careType == null) {
            throw new IllegalArgumentException("CareType is required");
        }
        if (location == null) {
            throw new IllegalArgumentException("Location is required");
        }
        this.name = name.trim();
        this.specialization = specialization == null ? this.specialization : specialization.trim();
        this.experienceYears = experienceYears;
        this.professionalDescription = professionalDescription;
        this.careType = careType;
        this.location = location;
        this.updatedAt = Instant.now();
        record(new DoctorProfileUpdated(id.value()));
    }

    public Image addImage(String url, String title, String description) {
        Image image = Image.newOne(url, title, description);
        this.images = this.images.add(image);
        this.updatedAt = Instant.now();
        record(new ImageAddedToDoctor(id.value(), image.id(), url));
        return image;
    }

    public void updateRating(Rating newRating) {
        if (newRating == null) {
            throw new IllegalArgumentException("Rating cannot be null");
        }
        this.rating = newRating;
        this.updatedAt = Instant.now();
        record(new DoctorRatingUpdated(id.value(), newRating.average(), newRating.count()));
    }

    public DoctorId id() { return id; }
    public UserId userId() { return userId; }
    public String name() { return name; }
    public Email email() { return email; }
    public PhoneNumber phoneNumber() { return phoneNumber; }
    public String profileImageUrl() { return profileImageUrl; }
    public String specialization() { return specialization; }
    public int experienceYears() { return experienceYears; }
    public String professionalDescription() { return professionalDescription; }
    public CareType careType() { return careType; }
    public Location location() { return location; }
    public ImageGallery images() { return images; }
    public Rating rating() { return rating; }
    public boolean verified() { return verified; }
    public DoctorStatus status() { return status; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}

package com.encuentratumedico.msdoctor.domain.model.shared;

public record GeoPoint(double latitude, double longitude) {
    public GeoPoint {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Latitude out of range: " + latitude);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Longitude out of range: " + longitude);
        }
    }
}

package com.encuentratumedico.msdoctor.domain.model.shared;

public record Location(String city, String address, GeoPoint coordinates) {
    public Location {
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("City cannot be empty");
        }
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Address cannot be empty");
        }
        city = city.trim();
        address = address.trim();
    }
}

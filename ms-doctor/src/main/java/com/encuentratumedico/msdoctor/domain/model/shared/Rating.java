package com.encuentratumedico.msdoctor.domain.model.shared;

public record Rating(double average, int count) {
    public Rating {
        if (count < 0) {
            throw new IllegalArgumentException("Review count cannot be negative");
        }
        if (count == 0 && average != 0.0) {
            throw new IllegalArgumentException("Average must be 0 when count is 0");
        }
        if (count > 0 && (average < 0.0 || average > 5.0)) {
            throw new IllegalArgumentException("Average out of range: " + average);
        }
    }

    public static Rating empty() {
        return new Rating(0.0, 0);
    }

    public static Rating of(double sum, int count) {
        if (count == 0) return empty();
        double avg = Math.round((sum / count) * 10.0) / 10.0;
        return new Rating(avg, count);
    }
}

package com.encuentratumedico.msdoctor.application.command;

public record SubmitReviewCommand(
        String doctorId,
        String patientId,
        String patientName,
        String appointmentId,
        Integer rating,
        String comment) {
}

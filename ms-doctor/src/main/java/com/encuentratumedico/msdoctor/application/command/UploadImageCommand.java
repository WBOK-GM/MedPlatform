package com.encuentratumedico.msdoctor.application.command;

public record UploadImageCommand(String doctorId, String url, String title, String description) {
}

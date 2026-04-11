package com.encuentratumedico.msdoctor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Bindea las propiedades ms-appointment.* del application.yml
 * y elimina el warning "Unknown property" del IDE.
 */
@Configuration
@ConfigurationProperties(prefix = "ms-appointment")
@Data
public class MsAppointmentProperties {
    private String internalUrl;
}

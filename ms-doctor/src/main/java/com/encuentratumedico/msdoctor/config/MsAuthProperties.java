package com.encuentratumedico.msdoctor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Bindea las propiedades ms-auth.* y ms-appointment.* del application.yml
 * y elimina el warning "Unknown property" del IDE.
 */
@Configuration
@ConfigurationProperties(prefix = "ms-auth")
@Data
public class MsAuthProperties {
    private String internalUrl;
}

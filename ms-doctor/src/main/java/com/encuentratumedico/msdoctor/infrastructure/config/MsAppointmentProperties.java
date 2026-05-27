package com.encuentratumedico.msdoctor.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ms-appointment")
@Data
public class MsAppointmentProperties {
    private String internalUrl;
}

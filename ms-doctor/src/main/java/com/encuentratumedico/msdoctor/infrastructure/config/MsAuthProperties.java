package com.encuentratumedico.msdoctor.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ms-auth")
@Data
public class MsAuthProperties {
    private String internalUrl;
}

package com.encuentratumedico.msdoctor.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI doctorOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Doctor Microservice")
                        .version("1.0.0")
                        .description(
                                "Gestión de perfiles médicos, disponibilidad y reseñas. " +
                                "Arquitectura DDD + Hexagonal. " +
                                "Permite buscar médicos por especialidad, ciudad y modalidad de atención, " +
                                "administrar imágenes de perfil y moderar reseñas de pacientes."
                        ));
    }
}

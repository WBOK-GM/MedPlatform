package com.encuentratumedico.msdoctor.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Habilita @CreatedDate y @LastModifiedDate en documentos de MongoDB.
 * Sin esta anotación, los campos createdAt/updatedAt del documento Doctor nunca se rellenan.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}

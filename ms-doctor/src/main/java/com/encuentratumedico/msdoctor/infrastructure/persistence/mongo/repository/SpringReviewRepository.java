package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.repository;

import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.ReviewDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringReviewRepository extends MongoRepository<ReviewDocument, String> {

    Page<ReviewDocument> findByDoctorIdAndStatus(String doctorId, String status, Pageable pageable);

    List<ReviewDocument> findByDoctorIdAndStatus(String doctorId, String status);

    boolean existsByAppointmentIdAndPatientId(String appointmentId, String patientId);
}

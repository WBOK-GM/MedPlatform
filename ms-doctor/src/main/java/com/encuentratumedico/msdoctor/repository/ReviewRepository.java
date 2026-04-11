package com.encuentratumedico.msdoctor.repository;

import com.encuentratumedico.msdoctor.document.Review;
import com.encuentratumedico.msdoctor.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {

    // Reseñas visibles de un médico (US-025)
    Page<Review> findByDoctorIdAndStatus(String doctorId, ReviewStatus status, Pageable pageable);

    // Todas las reseñas de un médico (admin)
    Page<Review> findByDoctorId(String doctorId, Pageable pageable);

    // Verificar que un paciente no haya ya reseñado la misma cita (índice compuesto)
    boolean existsByAppointmentIdAndPatientId(String appointmentId, String patientId);

    // Contar reseñas activas para recalcular promedio
    long countByDoctorIdAndStatus(String doctorId, ReviewStatus status);

    // Suma de ratings para calcular promedio (se hace con aggregation en service)
    Optional<Review> findByIdAndDoctorId(String id, String doctorId);
}

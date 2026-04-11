package com.encuentratumedico.msdoctor.service;

import com.encuentratumedico.msdoctor.document.Review;
import com.encuentratumedico.msdoctor.dto.ReviewRequestDTO;
import com.encuentratumedico.msdoctor.enums.ReviewStatus;
import com.encuentratumedico.msdoctor.exception.ResourceNotFoundException;
import com.encuentratumedico.msdoctor.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final DoctorService doctorService;

    public Review createReview(String doctorId, ReviewRequestDTO request) {
        // 1. Validar que no exista duplicate review
        if (reviewRepository.existsByAppointmentIdAndPatientId(request.getAppointmentId(), request.getPatientId())) {
            throw new IllegalArgumentException("El paciente ya ha realizado una reseña para esta cita.");
        }

        // Validar contra ms-appointment que la cita exista y esté COMPLETADA.
        // Esta integración se activará cuando ms-appointment exponga el endpoint interno.
        // Por ahora se omite para que el MVP funcione sin dependencia estricta.

        // 3. Crear reseña
        Review review = Review.builder()
                .doctorId(doctorId)
                .patientId(request.getPatientId())
                .patientName(request.getPatientName())
                .appointmentId(request.getAppointmentId())
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);

        // 4. Recalcular promedio del doctor
        recalculateDoctorRating(doctorId);

        return savedReview;
    }

    public Page<Review> getActiveReviewsByDoctor(String doctorId, Pageable pageable) {
        return reviewRepository.findByDoctorIdAndStatus(doctorId, ReviewStatus.ACTIVE, pageable);
    }

    public Review hideReview(String reviewId, String adminUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        
        review.setStatus(ReviewStatus.HIDDEN);
        review.setModeratedBy(adminUserId);
        review.setModeratedAt(LocalDateTime.now());
        
        Review saved = reviewRepository.save(review);
        recalculateDoctorRating(review.getDoctorId());
        return saved;
    }

    private void recalculateDoctorRating(String doctorId) {
        // Obtener todas las reviews activas (en producción con aggregation $group)
        // Para simplificar aquí:
        long count = reviewRepository.countByDoctorIdAndStatus(doctorId, ReviewStatus.ACTIVE);
        
        if (count == 0) {
            doctorService.updateRating(doctorId, 0.0, 0);
            return;
        }

        // Forma más ineficiente pero simple en Java para MVP:
        double sum = reviewRepository.findByDoctorIdAndStatus(doctorId, ReviewStatus.ACTIVE, Pageable.unpaged())
                .stream().mapToDouble(Review::getRating).sum();

        double avg = sum / count;
        // Redondear a 1 decimal
        avg = Math.round(avg * 10.0) / 10.0;
        
        doctorService.updateRating(doctorId, avg, (int) count);
    }
}

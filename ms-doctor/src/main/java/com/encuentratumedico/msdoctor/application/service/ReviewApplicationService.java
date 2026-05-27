package com.encuentratumedico.msdoctor.application.service;

import com.encuentratumedico.msdoctor.application.command.HideReviewCommand;
import com.encuentratumedico.msdoctor.application.command.SubmitReviewCommand;
import com.encuentratumedico.msdoctor.application.view.ReviewView;
import com.encuentratumedico.msdoctor.domain.exception.DoctorNotFoundException;
import com.encuentratumedico.msdoctor.domain.exception.DuplicateReviewException;
import com.encuentratumedico.msdoctor.domain.exception.ReviewNotFoundException;
import com.encuentratumedico.msdoctor.domain.model.doctor.Doctor;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.review.RatingValue;
import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewId;
import com.encuentratumedico.msdoctor.domain.model.shared.Rating;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorReviewsUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.HideReviewUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.SubmitReviewUseCase;
import com.encuentratumedico.msdoctor.domain.port.out.DoctorRepositoryPort;
import com.encuentratumedico.msdoctor.domain.port.out.EventPublisherPort;
import com.encuentratumedico.msdoctor.domain.port.out.ReviewRepositoryPort;
import com.encuentratumedico.msdoctor.domain.service.RatingRecalculationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.encuentratumedico.msdoctor.domain.model.review.ReviewStatus;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewApplicationService implements SubmitReviewUseCase, GetDoctorReviewsUseCase, HideReviewUseCase {

    private final ReviewRepositoryPort reviewRepository;
    private final DoctorRepositoryPort doctorRepository;
    private final EventPublisherPort eventPublisher;

    public ReviewApplicationService(ReviewRepositoryPort reviewRepository,
                                    DoctorRepositoryPort doctorRepository,
                                    EventPublisherPort eventPublisher) {
        this.reviewRepository = reviewRepository;
        this.doctorRepository = doctorRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public ReviewView submit(SubmitReviewCommand cmd) {
        if (reviewRepository.existsByAppointmentIdAndPatientId(cmd.appointmentId(), cmd.patientId())) {
            throw new DuplicateReviewException();
        }
        DoctorId doctorId = DoctorId.of(cmd.doctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new DoctorNotFoundException("id", cmd.doctorId()));

        Review review = Review.submit(
                doctorId,
                UserId.of(cmd.patientId()),
                cmd.patientName(),
                cmd.appointmentId(),
                RatingValue.of(cmd.rating()),
                cmd.comment());

        Review saved = reviewRepository.save(review);

        List<Review> activeReviews = new ArrayList<>(reviewRepository.listActiveByDoctor(doctorId));
        Rating newRating = RatingRecalculationService.recalculate(activeReviews);
        doctor.updateRating(newRating);
        doctorRepository.save(doctor);

        List<com.encuentratumedico.msdoctor.shared.domain.DomainEvent> events = new ArrayList<>();
        events.addAll(review.pullEvents());
        events.addAll(doctor.pullEvents());
        eventPublisher.publishAll(events);

        return ReviewView.from(saved);
    }

    @Override
    public Page<ReviewView> getActiveReviews(String doctorId, Pageable pageable) {
        return reviewRepository.findByDoctorAndStatus(DoctorId.of(doctorId), ReviewStatus.ACTIVE, pageable)
                .map(ReviewView::from);
    }

    @Override
    public ReviewView hide(HideReviewCommand cmd) {
        Review review = reviewRepository.findById(ReviewId.of(cmd.reviewId()))
                .orElseThrow(() -> new ReviewNotFoundException(cmd.reviewId()));
        review.hide(cmd.adminUserId());
        Review saved = reviewRepository.save(review);

        Doctor doctor = doctorRepository.findById(review.doctorId())
                .orElseThrow(() -> new DoctorNotFoundException("id", review.doctorId().value()));
        List<Review> activeReviews = new ArrayList<>(reviewRepository.listActiveByDoctor(review.doctorId()));
        Rating newRating = RatingRecalculationService.recalculate(activeReviews);
        doctor.updateRating(newRating);
        doctorRepository.save(doctor);

        List<com.encuentratumedico.msdoctor.shared.domain.DomainEvent> events = new ArrayList<>();
        events.addAll(review.pullEvents());
        events.addAll(doctor.pullEvents());
        eventPublisher.publishAll(events);

        return ReviewView.from(saved);
    }
}

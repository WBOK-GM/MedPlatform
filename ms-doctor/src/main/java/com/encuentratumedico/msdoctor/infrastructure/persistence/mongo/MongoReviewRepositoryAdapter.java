package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo;

import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.review.Review;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewId;
import com.encuentratumedico.msdoctor.domain.model.review.ReviewStatus;
import com.encuentratumedico.msdoctor.domain.port.out.ReviewRepositoryPort;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.ReviewDocument;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.mapper.ReviewPersistenceMapper;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.repository.SpringReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class MongoReviewRepositoryAdapter implements ReviewRepositoryPort {

    private final SpringReviewRepository springRepo;

    public MongoReviewRepositoryAdapter(SpringReviewRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Review save(Review review) {
        ReviewDocument existing = springRepo.findById(review.id().value()).orElse(null);
        ReviewDocument doc = ReviewPersistenceMapper.toDocument(review, existing);
        ReviewDocument saved = springRepo.save(doc);
        return ReviewPersistenceMapper.toDomain(saved);
    }

    @Override
    public Optional<Review> findById(ReviewId id) {
        return springRepo.findById(id.value()).map(ReviewPersistenceMapper::toDomain);
    }

    @Override
    public Page<Review> findByDoctorAndStatus(DoctorId doctorId, ReviewStatus status, Pageable pageable) {
        return springRepo.findByDoctorIdAndStatus(doctorId.value(), status.name(), pageable)
                .map(ReviewPersistenceMapper::toDomain);
    }

    @Override
    public List<Review> listActiveByDoctor(DoctorId doctorId) {
        return springRepo.findByDoctorIdAndStatus(doctorId.value(), ReviewStatus.ACTIVE.name())
                .stream().map(ReviewPersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public boolean existsByAppointmentIdAndPatientId(String appointmentId, String patientId) {
        return springRepo.existsByAppointmentIdAndPatientId(appointmentId, patientId);
    }
}

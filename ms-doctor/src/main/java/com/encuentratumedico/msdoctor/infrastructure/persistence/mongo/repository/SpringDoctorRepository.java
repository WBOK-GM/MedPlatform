package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.repository;

import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.DoctorDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDoctorRepository extends MongoRepository<DoctorDocument, String> {

    Optional<DoctorDocument> findByUserId(String userId);

    boolean existsByUserId(String userId);

    Page<DoctorDocument> findBySpecializationIgnoreCaseAndStatus(
            String specialization, String status, Pageable pageable);

    @Query("{ 'location.city': { $regex: ?0, $options: 'i' }, 'status': ?1 }")
    Page<DoctorDocument> findByLocationCityIgnoreCaseAndStatus(
            String city, String status, Pageable pageable);

    Page<DoctorDocument> findByCareTypeAndStatus(String careType, String status, Pageable pageable);

    @Query("{ 'specialization': { $regex: ?0, $options: 'i' }, 'location.city': { $regex: ?1, $options: 'i' }, 'status': ?2 }")
    Page<DoctorDocument> findBySpecializationAndCityAndStatus(
            String specialization, String city, String status, Pageable pageable);

    @Query("{ 'specialization': { $regex: ?0, $options: 'i' }, 'location.city': { $regex: ?1, $options: 'i' }, 'care_type': ?2, 'status': ?3 }")
    Page<DoctorDocument> findBySpecializationAndCityAndCareTypeAndStatus(
            String specialization, String city, String careType, String status, Pageable pageable);

    Page<DoctorDocument> findByStatus(String status, Pageable pageable);
}

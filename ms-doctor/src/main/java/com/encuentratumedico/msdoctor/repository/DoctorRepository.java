package com.encuentratumedico.msdoctor.repository;

import com.encuentratumedico.msdoctor.document.Doctor;
import com.encuentratumedico.msdoctor.enums.CareType;
import com.encuentratumedico.msdoctor.enums.DoctorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {

    Optional<Doctor> findByUserId(String userId);

    boolean existsByUserId(String userId);

    // Búsqueda por especialidad (US-010)
    Page<Doctor> findBySpecializationIgnoreCaseAndStatus(
            String specialization, DoctorStatus status, Pageable pageable);

    // Búsqueda por ciudad (US-011) - case insensitive
    @Query("{ 'location.city': { $regex: ?0, $options: 'i' }, 'status': ?1 }")
    Page<Doctor> findByLocationCityIgnoreCaseAndStatus(
            String city, DoctorStatus status, Pageable pageable);

    // Búsqueda por modalidad (US-012)
    Page<Doctor> findByCareTypeAndStatus(
            CareType careType, DoctorStatus status, Pageable pageable);

    // Búsqueda combinada especialidad + ciudad (US-010 + US-011)
    @Query("{ 'specialization': { $regex: ?0, $options: 'i' }, 'location.city': { $regex: ?1, $options: 'i' }, 'status': ?2 }")
    Page<Doctor> findBySpecializationAndCityAndStatus(
            String specialization, String city, DoctorStatus status, Pageable pageable);

    // Búsqueda combinada especialidad + ciudad + modalidad (US-014)
    @Query("{ 'specialization': { $regex: ?0, $options: 'i' }, 'location.city': { $regex: ?1, $options: 'i' }, 'care_type': ?2, 'status': ?3 }")
    Page<Doctor> findBySpecializationAndCityAndCareTypeAndStatus(
            String specialization, String city, CareType careType, DoctorStatus status, Pageable pageable);

    // Listado general activos (US-014)
    Page<Doctor> findByStatus(DoctorStatus status, Pageable pageable);
}

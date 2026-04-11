package com.encuentratumedico.msdoctor.service;

import com.encuentratumedico.msdoctor.document.Doctor;
import com.encuentratumedico.msdoctor.document.embedded.Image;
import com.encuentratumedico.msdoctor.dto.DoctorRequestDTO;
import com.encuentratumedico.msdoctor.dto.DoctorResponseDTO;
import com.encuentratumedico.msdoctor.enums.CareType;
import com.encuentratumedico.msdoctor.enums.DoctorStatus;
import com.encuentratumedico.msdoctor.exception.ResourceNotFoundException;
import com.encuentratumedico.msdoctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorResponseDTO createProfile(DoctorRequestDTO request) {
        if (doctorRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("El usuario ya tiene un perfil médico asociado.");
        }

        Doctor doctor = Doctor.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .profileImageUrl(request.getProfileImageUrl())
                .specialization(request.getSpecialization())
                .experienceYears(request.getExperienceYears())
                .professionalDescription(request.getProfessionalDescription())
                .careType(request.getCareType())
                .location(request.getLocation())
                .build();

        // MongoDB takes care of createdAt via @CreatedDate (if config enabled) or we set it manually
        doctor.setCreatedAt(LocalDateTime.now());
        
        return mapToDTO(doctorRepository.save(doctor));
    }

    public DoctorResponseDTO updateProfile(String id, DoctorRequestDTO request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        
        doctor.setName(request.getName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setProfessionalDescription(request.getProfessionalDescription());
        doctor.setCareType(request.getCareType());
        doctor.setLocation(request.getLocation());
        doctor.setUpdatedAt(LocalDateTime.now());

        return mapToDTO(doctorRepository.save(doctor));
    }

    public DoctorResponseDTO getDoctorById(String id) {
        return doctorRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
    }

    public DoctorResponseDTO getDoctorByUserId(String userId) {
        return doctorRepository.findByUserId(userId)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", userId));
    }

    public Page<DoctorResponseDTO> searchDoctors(String specialization, String city, CareType careType, Pageable pageable) {
        Page<Doctor> doctors;

        boolean hasSpec = specialization != null && !specialization.isBlank();
        boolean hasCity = city != null && !city.isBlank();
        boolean hasCareType = careType != null;

        if (hasSpec && hasCity && hasCareType) {
            doctors = doctorRepository.findBySpecializationAndCityAndCareTypeAndStatus(specialization, city, careType, DoctorStatus.ACTIVE, pageable);
        } else if (hasSpec && hasCity) {
            doctors = doctorRepository.findBySpecializationAndCityAndStatus(specialization, city, DoctorStatus.ACTIVE, pageable);
        } else if (hasSpec) {
            doctors = doctorRepository.findBySpecializationIgnoreCaseAndStatus(specialization, DoctorStatus.ACTIVE, pageable);
        } else if (hasCity) {
            doctors = doctorRepository.findByLocationCityIgnoreCaseAndStatus(city, DoctorStatus.ACTIVE, pageable);
        } else if (hasCareType) {
            doctors = doctorRepository.findByCareTypeAndStatus(careType, DoctorStatus.ACTIVE, pageable);
        } else {
            doctors = doctorRepository.findByStatus(DoctorStatus.ACTIVE, pageable);
        }

        return doctors.map(this::mapToDTO);
    }
    
    public DoctorResponseDTO uploadImage(String id, String url, String title, String description) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
                
        Image image = Image.builder()
            .id(UUID.randomUUID().toString())
            .url(url)
            .title(title)
            .description(description)
            .uploadedAt(LocalDateTime.now())
            .build();
            
        doctor.getImages().add(image);
        return mapToDTO(doctorRepository.save(doctor));
    }

    public void updateRating(String doctorId, double averageRating, int reviewCount) {
        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow();
        doctor.setAverageRating(averageRating);
        doctor.setReviewCount(reviewCount);
        doctorRepository.save(doctor);
    }

    private DoctorResponseDTO mapToDTO(Doctor doctor) {
        return DoctorResponseDTO.builder()
                .id(doctor.getId())
                .userId(doctor.getUserId())
                .name(doctor.getName())
                .specialization(doctor.getSpecialization())
                .experienceYears(doctor.getExperienceYears())
                .professionalDescription(doctor.getProfessionalDescription())
                .careType(doctor.getCareType())
                .location(doctor.getLocation())
                .images(doctor.getImages())
                .averageRating(doctor.getAverageRating())
                .reviewCount(doctor.getReviewCount())
                .isVerified(doctor.getIsVerified())
                .status(doctor.getStatus())
                .createdAt(doctor.getCreatedAt())
                .build();
    }
}

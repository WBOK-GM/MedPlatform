package com.encuentratumedico.msdoctor.infrastructure.persistence.mongo;

import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.model.doctor.Doctor;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorStatus;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.domain.port.out.DoctorRepositoryPort;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.document.DoctorDocument;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.mapper.DoctorPersistenceMapper;
import com.encuentratumedico.msdoctor.infrastructure.persistence.mongo.repository.SpringDoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class MongoDoctorRepositoryAdapter implements DoctorRepositoryPort {

    private final SpringDoctorRepository springRepo;

    public MongoDoctorRepositoryAdapter(SpringDoctorRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Doctor save(Doctor doctor) {
        DoctorDocument existing = springRepo.findById(doctor.id().value()).orElse(null);
        DoctorDocument doc = DoctorPersistenceMapper.toDocument(doctor, existing);
        DoctorDocument saved = springRepo.save(doc);
        return DoctorPersistenceMapper.toDomain(saved);
    }

    @Override
    public Optional<Doctor> findById(DoctorId id) {
        return springRepo.findById(id.value()).map(DoctorPersistenceMapper::toDomain);
    }

    @Override
    public Optional<Doctor> findByUserId(UserId userId) {
        return springRepo.findByUserId(userId.value()).map(DoctorPersistenceMapper::toDomain);
    }

    @Override
    public boolean existsByUserId(UserId userId) {
        return springRepo.existsByUserId(userId.value());
    }

    @Override
    public Page<Doctor> search(String specialization, String city, CareType careType,
                               DoctorStatus status, Pageable pageable) {
        boolean hasSpec = specialization != null && !specialization.isBlank();
        boolean hasCity = city != null && !city.isBlank();
        boolean hasCareType = careType != null;
        String statusName = status.name();

        Page<DoctorDocument> page;
        if (hasSpec && hasCity && hasCareType) {
            page = springRepo.findBySpecializationAndCityAndCareTypeAndStatus(specialization, city, careType.name(), statusName, pageable);
        } else if (hasSpec && hasCity) {
            page = springRepo.findBySpecializationAndCityAndStatus(specialization, city, statusName, pageable);
        } else if (hasSpec) {
            page = springRepo.findBySpecializationIgnoreCaseAndStatus(specialization, statusName, pageable);
        } else if (hasCity) {
            page = springRepo.findByLocationCityIgnoreCaseAndStatus(city, statusName, pageable);
        } else if (hasCareType) {
            page = springRepo.findByCareTypeAndStatus(careType.name(), statusName, pageable);
        } else {
            page = springRepo.findByStatus(statusName, pageable);
        }
        return page.map(DoctorPersistenceMapper::toDomain);
    }
}

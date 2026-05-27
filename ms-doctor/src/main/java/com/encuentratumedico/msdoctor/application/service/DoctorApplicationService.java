package com.encuentratumedico.msdoctor.application.service;

import com.encuentratumedico.msdoctor.application.command.RegisterDoctorCommand;
import com.encuentratumedico.msdoctor.application.command.UpdateDoctorProfileCommand;
import com.encuentratumedico.msdoctor.application.command.UploadImageCommand;
import com.encuentratumedico.msdoctor.application.query.SearchDoctorsQuery;
import com.encuentratumedico.msdoctor.application.view.DoctorView;
import com.encuentratumedico.msdoctor.domain.exception.DoctorAlreadyExistsException;
import com.encuentratumedico.msdoctor.domain.exception.DoctorNotFoundException;
import com.encuentratumedico.msdoctor.domain.model.doctor.Doctor;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorId;
import com.encuentratumedico.msdoctor.domain.model.doctor.DoctorStatus;
import com.encuentratumedico.msdoctor.domain.model.shared.Email;
import com.encuentratumedico.msdoctor.domain.model.shared.PhoneNumber;
import com.encuentratumedico.msdoctor.domain.model.shared.UserId;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorByIdUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorByUserIdUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.RegisterDoctorUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.SearchDoctorsUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.UpdateDoctorProfileUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.UploadImageUseCase;
import com.encuentratumedico.msdoctor.domain.port.out.DoctorRepositoryPort;
import com.encuentratumedico.msdoctor.domain.port.out.EventPublisherPort;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
public class DoctorApplicationService implements
        RegisterDoctorUseCase, UpdateDoctorProfileUseCase,
        GetDoctorByIdUseCase, GetDoctorByUserIdUseCase,
        SearchDoctorsUseCase, UploadImageUseCase {

    private final DoctorRepositoryPort doctorRepository;
    private final EventPublisherPort eventPublisher;

    public DoctorApplicationService(DoctorRepositoryPort doctorRepository,
                                    EventPublisherPort eventPublisher) {
        this.doctorRepository = doctorRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public DoctorView register(RegisterDoctorCommand cmd) {
        UserId userId = UserId.of(cmd.userId());
        if (doctorRepository.existsByUserId(userId)) {
            throw new DoctorAlreadyExistsException(cmd.userId());
        }
        Doctor doctor = Doctor.register(
                userId,
                cmd.name(),
                Email.ofNullable(cmd.email()),
                PhoneNumber.ofNullable(cmd.phoneNumber()),
                cmd.profileImageUrl(),
                cmd.specialization(),
                cmd.experienceYears() == null ? 0 : cmd.experienceYears(),
                cmd.professionalDescription(),
                cmd.careType(),
                cmd.location());
        Doctor saved = doctorRepository.save(doctor);
        eventPublisher.publishAll(doctor.pullEvents());
        return DoctorView.from(saved);
    }

    @Override
    public DoctorView updateProfile(UpdateDoctorProfileCommand cmd) {
        Doctor doctor = doctorRepository.findById(DoctorId.of(cmd.doctorId()))
                .orElseThrow(() -> new DoctorNotFoundException("id", cmd.doctorId()));
        doctor.updateProfile(
                cmd.name(),
                cmd.specialization(),
                cmd.experienceYears() == null ? 0 : cmd.experienceYears(),
                cmd.professionalDescription(),
                cmd.careType(),
                cmd.location());
        Doctor saved = doctorRepository.save(doctor);
        eventPublisher.publishAll(doctor.pullEvents());
        return DoctorView.from(saved);
    }

    @Override
    public DoctorView getById(String doctorId) {
        return doctorRepository.findById(DoctorId.of(doctorId))
                .map(DoctorView::from)
                .orElseThrow(() -> new DoctorNotFoundException("id", doctorId));
    }

    @Override
    public DoctorView getByUserId(String userId) {
        return doctorRepository.findByUserId(UserId.of(userId))
                .map(DoctorView::from)
                .orElseThrow(() -> new DoctorNotFoundException("userId", userId));
    }

    @Override
    public Page<DoctorView> search(SearchDoctorsQuery query) {
        return doctorRepository.search(
                query.specialization(), query.city(), query.careType(),
                DoctorStatus.ACTIVE, query.pageable()
        ).map(DoctorView::from);
    }

    @Override
    public DoctorView uploadImage(UploadImageCommand cmd) {
        Doctor doctor = doctorRepository.findById(DoctorId.of(cmd.doctorId()))
                .orElseThrow(() -> new DoctorNotFoundException("id", cmd.doctorId()));
        doctor.addImage(cmd.url(), cmd.title(), cmd.description());
        Doctor saved = doctorRepository.save(doctor);
        eventPublisher.publishAll(doctor.pullEvents());
        return DoctorView.from(saved);
    }
}

package com.encuentratumedico.msdoctor.infrastructure.web.controller;

import com.encuentratumedico.msdoctor.application.command.UploadImageCommand;
import com.encuentratumedico.msdoctor.application.query.SearchDoctorsQuery;
import com.encuentratumedico.msdoctor.application.view.DoctorView;
import com.encuentratumedico.msdoctor.domain.model.doctor.CareType;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorByIdUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorByUserIdUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.RegisterDoctorUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.SearchDoctorsUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.UpdateDoctorProfileUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.UploadImageUseCase;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.DoctorRequestDTO;
import com.encuentratumedico.msdoctor.infrastructure.web.mapper.WebRequestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctors")
@Tag(name = "Doctor", description = "API de Perfiles Médicos")
public class DoctorController {

    private final RegisterDoctorUseCase registerDoctor;
    private final UpdateDoctorProfileUseCase updateDoctor;
    private final GetDoctorByIdUseCase getById;
    private final GetDoctorByUserIdUseCase getByUserId;
    private final SearchDoctorsUseCase search;
    private final UploadImageUseCase uploadImage;

    public DoctorController(RegisterDoctorUseCase registerDoctor,
                            UpdateDoctorProfileUseCase updateDoctor,
                            GetDoctorByIdUseCase getById,
                            GetDoctorByUserIdUseCase getByUserId,
                            SearchDoctorsUseCase search,
                            UploadImageUseCase uploadImage) {
        this.registerDoctor = registerDoctor;
        this.updateDoctor = updateDoctor;
        this.getById = getById;
        this.getByUserId = getByUserId;
        this.search = search;
        this.uploadImage = uploadImage;
    }

    @PostMapping
    @Operation(summary = "Crear un perfil médico (US-006)")
    public ResponseEntity<DoctorView> createProfile(@Valid @RequestBody DoctorRequestDTO request) {
        return new ResponseEntity<>(
                registerDoctor.register(WebRequestMapper.toRegisterCommand(request)),
                HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar perfil médico (US-007)")
    public ResponseEntity<DoctorView> updateProfile(@PathVariable String id,
                                                    @Valid @RequestBody DoctorRequestDTO request) {
        return ResponseEntity.ok(updateDoctor.updateProfile(WebRequestMapper.toUpdateCommand(id, request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil de médico por ID")
    public ResponseEntity<DoctorView> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(getById.getById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtener perfil de médico por UUID de ms-auth")
    public ResponseEntity<DoctorView> getDoctorByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(getByUserId.getByUserId(userId));
    }

    @GetMapping
    @Operation(summary = "Buscar médicos con filtros y paginación (US-010, US-011, US-012, US-014)")
    public ResponseEntity<Page<DoctorView>> searchDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) CareType careType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(search.search(new SearchDoctorsQuery(specialization, city, careType, pageable)));
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Agregar imagen al perfil (US-008)")
    public ResponseEntity<DoctorView> uploadImageEndpoint(
            @PathVariable String id,
            @RequestParam String url,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(uploadImage.uploadImage(new UploadImageCommand(id, url, title, description)));
    }
}

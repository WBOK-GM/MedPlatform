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
import io.swagger.v3.oas.annotations.Parameter;
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
    @Operation(
        summary = "Crear perfil médico (US-006)",
        description = "Registra un nuevo perfil de médico en la plataforma. Requiere que el usuario ya exista en ms-auth (campo userId)."
    )
    public ResponseEntity<DoctorView> createProfile(@Valid @RequestBody DoctorRequestDTO request) {
        return new ResponseEntity<>(
                registerDoctor.register(WebRequestMapper.toRegisterCommand(request)),
                HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Editar perfil médico (US-007)",
        description = "Actualiza los datos del perfil de un médico existente. Se reemplaza toda la información editable."
    )
    public ResponseEntity<DoctorView> updateProfile(
            @Parameter(description = "ID del perfil médico a actualizar") @PathVariable String id,
            @Valid @RequestBody DoctorRequestDTO request) {
        return ResponseEntity.ok(updateDoctor.updateProfile(WebRequestMapper.toUpdateCommand(id, request)));
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtener perfil de médico por ID",
        description = "Devuelve el perfil completo de un médico dado su ID de perfil (no su userId de ms-auth)."
    )
    public ResponseEntity<DoctorView> getDoctorById(
            @Parameter(description = "ID del perfil médico") @PathVariable String id) {
        return ResponseEntity.ok(getById.getById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(
        summary = "Obtener perfil de médico por userId de ms-auth",
        description = "Permite al frontend recuperar el perfil médico usando el UUID del usuario autenticado (token JWT)."
    )
    public ResponseEntity<DoctorView> getDoctorByUserId(
            @Parameter(description = "UUID del usuario en ms-auth") @PathVariable String userId) {
        return ResponseEntity.ok(getByUserId.getByUserId(userId));
    }

    @GetMapping
    @Operation(
        summary = "Buscar médicos con filtros y paginación (US-010, US-011, US-012, US-014)",
        description = "Listado paginado de médicos activos. Filtra por especialidad, ciudad y/o modalidad de atención."
    )
    public ResponseEntity<Page<DoctorView>> searchDoctors(
            @Parameter(description = "Filtro por especialidad, p. ej. Cardiología") @RequestParam(required = false) String specialization,
            @Parameter(description = "Filtro por ciudad, p. ej. Bogotá") @RequestParam(required = false) String city,
            @Parameter(description = "Filtro por modalidad: IN_PERSON, VIRTUAL o HYBRID") @RequestParam(required = false) CareType careType,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(search.search(new SearchDoctorsQuery(specialization, city, careType, pageable)));
    }

    @PostMapping("/{id}/images")
    @Operation(
        summary = "Agregar imagen al perfil (US-008)",
        description = "Asocia una imagen al perfil del médico mediante su URL pública. Opcionalmente incluye título y descripción."
    )
    public ResponseEntity<DoctorView> uploadImageEndpoint(
            @Parameter(description = "ID del perfil médico") @PathVariable String id,
            @Parameter(description = "URL pública de la imagen", required = true) @RequestParam String url,
            @Parameter(description = "Título descriptivo de la imagen") @RequestParam(required = false) String title,
            @Parameter(description = "Descripción de la imagen") @RequestParam(required = false) String description) {
        return ResponseEntity.ok(uploadImage.uploadImage(new UploadImageCommand(id, url, title, description)));
    }
}

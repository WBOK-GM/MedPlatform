package com.encuentratumedico.msdoctor.controller;

import com.encuentratumedico.msdoctor.dto.DoctorRequestDTO;
import com.encuentratumedico.msdoctor.dto.DoctorResponseDTO;
import com.encuentratumedico.msdoctor.enums.CareType;
import com.encuentratumedico.msdoctor.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctor", description = "API de Perfiles Médicos")
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping
    @Operation(summary = "Crear un perfil médico (US-006)")
    public ResponseEntity<DoctorResponseDTO> createProfile(@Valid @RequestBody DoctorRequestDTO request) {
        return new ResponseEntity<>(doctorService.createProfile(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar perfil médico (US-007)")
    public ResponseEntity<DoctorResponseDTO> updateProfile(
            @PathVariable String id, @Valid @RequestBody DoctorRequestDTO request) {
        return ResponseEntity.ok(doctorService.updateProfile(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil de médico por ID")
    public ResponseEntity<DoctorResponseDTO> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtener perfil de médico por UUID de ms-auth")
    public ResponseEntity<DoctorResponseDTO> getDoctorByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(doctorService.getDoctorByUserId(userId));
    }

    @GetMapping
    @Operation(summary = "Buscar médicos con filtros y paginación (US-010, US-011, US-012, US-014)")
    public ResponseEntity<Page<DoctorResponseDTO>> searchDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) CareType careType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(doctorService.searchDoctors(specialization, city, careType, pageable));
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Agregar imagen al perfil (US-008)")
    public ResponseEntity<DoctorResponseDTO> uploadImage(
            @PathVariable String id,
            @RequestParam String url,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description) {
        // En una app real, aquí se recibiría MultipartFile y se subiría a S3
        // Por simplicidad para el MVP, asumimos que el Gateway/Frontend ya la subió y manda la URL
        return ResponseEntity.ok(doctorService.uploadImage(id, url, title, description));
    }
}

package com.encuentratumedico.msdoctor.infrastructure.web.controller;

import com.encuentratumedico.msdoctor.application.command.HideReviewCommand;
import com.encuentratumedico.msdoctor.application.view.ReviewView;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorReviewsUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.HideReviewUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.SubmitReviewUseCase;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.ReviewRequestDTO;
import com.encuentratumedico.msdoctor.infrastructure.web.mapper.WebRequestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctors/{doctorId}/reviews")
@Tag(name = "Review", description = "API de Calificaciones y Reseñas")
public class ReviewController {

    private final SubmitReviewUseCase submitReview;
    private final GetDoctorReviewsUseCase getReviews;
    private final HideReviewUseCase hideReview;

    public ReviewController(SubmitReviewUseCase submitReview,
                            GetDoctorReviewsUseCase getReviews,
                            HideReviewUseCase hideReview) {
        this.submitReview = submitReview;
        this.getReviews = getReviews;
        this.hideReview = hideReview;
    }

    @PostMapping
    @Operation(
        summary = "Crear calificación y reseña (US-024)",
        description = "El paciente envía una calificación (1-5) y comentario sobre el médico tras una cita completada."
    )
    public ResponseEntity<ReviewView> createReview(
            @Parameter(description = "ID del perfil médico a calificar") @PathVariable String doctorId,
            @Valid @RequestBody ReviewRequestDTO request) {
        return new ResponseEntity<>(
                submitReview.submit(WebRequestMapper.toSubmitReviewCommand(doctorId, request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(
        summary = "Ver calificaciones del médico (US-025)",
        description = "Devuelve las reseñas activas (no ocultas) del médico ordenadas por fecha descendente."
    )
    public ResponseEntity<Page<ReviewView>> getDoctorReviews(
            @Parameter(description = "ID del perfil médico") @PathVariable String doctorId,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(getReviews.getActiveReviews(doctorId, pageable));
    }

    @PutMapping("/{reviewId}/hide")
    @Operation(
        summary = "Ocultar reseña (US-030) — solo admin",
        description = "Moderación: cambia el estado de la reseña a HIDDEN. Requiere enviar el header `X-User-Id` con el UUID del administrador."
    )
    public ResponseEntity<ReviewView> hide(
            @Parameter(description = "ID del perfil médico") @PathVariable String doctorId,
            @Parameter(description = "ID de la reseña a ocultar") @PathVariable String reviewId,
            @Parameter(description = "UUID del administrador que realiza la moderación") @RequestHeader("X-User-Id") String adminUserId) {
        return ResponseEntity.ok(hideReview.hide(new HideReviewCommand(reviewId, adminUserId)));
    }
}

package com.encuentratumedico.msdoctor.controller;

import com.encuentratumedico.msdoctor.document.Review;
import com.encuentratumedico.msdoctor.dto.ReviewRequestDTO;
import com.encuentratumedico.msdoctor.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctors/{doctorId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Review", description = "API de Calificaciones y Reseñas")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Crear calificación y reseña (US-024)")
    public ResponseEntity<Review> createReview(
            @PathVariable String doctorId,
            @Valid @RequestBody ReviewRequestDTO request) {
        return new ResponseEntity<>(reviewService.createReview(doctorId, request), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Ver calificaciones recientes del médico (US-025)")
    public ResponseEntity<Page<Review>> getDoctorReviews(
            @PathVariable String doctorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(reviewService.getActiveReviewsByDoctor(doctorId, pageable));
    }

    @PutMapping("/{reviewId}/hide")
    @Operation(summary = "Moderación admin: Ocultar reseña (US-030)")
    public ResponseEntity<Review> hideReview(
            @PathVariable String doctorId,
            @PathVariable String reviewId,
            @RequestHeader("X-User-Id") String adminUserId) {
        // En la vida real, asegurar por @PreAuthorize("hasRole('ADMINISTRATOR')")
        return ResponseEntity.ok(reviewService.hideReview(reviewId, adminUserId));
    }
}

package com.encuentratumedico.msdoctor.infrastructure.web.controller;

import com.encuentratumedico.msdoctor.application.command.HideReviewCommand;
import com.encuentratumedico.msdoctor.application.view.ReviewView;
import com.encuentratumedico.msdoctor.domain.port.in.GetDoctorReviewsUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.HideReviewUseCase;
import com.encuentratumedico.msdoctor.domain.port.in.SubmitReviewUseCase;
import com.encuentratumedico.msdoctor.infrastructure.web.dto.ReviewRequestDTO;
import com.encuentratumedico.msdoctor.infrastructure.web.mapper.WebRequestMapper;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "Crear calificación y reseña (US-024)")
    public ResponseEntity<ReviewView> createReview(@PathVariable String doctorId,
                                                   @Valid @RequestBody ReviewRequestDTO request) {
        return new ResponseEntity<>(
                submitReview.submit(WebRequestMapper.toSubmitReviewCommand(doctorId, request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Ver calificaciones recientes del médico (US-025)")
    public ResponseEntity<Page<ReviewView>> getDoctorReviews(@PathVariable String doctorId,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(getReviews.getActiveReviews(doctorId, pageable));
    }

    @PutMapping("/{reviewId}/hide")
    @Operation(summary = "Moderación admin: Ocultar reseña (US-030)")
    public ResponseEntity<ReviewView> hide(@PathVariable String doctorId,
                                           @PathVariable String reviewId,
                                           @RequestHeader("X-User-Id") String adminUserId) {
        return ResponseEntity.ok(hideReview.hide(new HideReviewCommand(reviewId, adminUserId)));
    }
}

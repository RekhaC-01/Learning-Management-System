package com.example.lms.controller;

import com.example.lms.dto.EnrollmentResponseDto;
import com.example.lms.model.Enrollment;
import com.example.lms.repository.EnrollmentRepository;
import com.example.lms.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @PostMapping
    public ResponseEntity<EnrollmentResponseDto> enrollStudent(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String role,
            @RequestBody(required = false) Map<String, Object> body) {

        // Fallback to JSON request body if query parameters are missing
        if (userId == null && body != null && body.get("userId") != null) {
            userId = Long.valueOf(body.get("userId").toString());
        }
        if (courseId == null && body != null && body.get("courseId") != null) {
            courseId = Long.valueOf(body.get("courseId").toString());
        }
        if (role == null && body != null && body.get("role") != null) {
            role = body.get("role").toString();
        } else if (role == null) {
            role = "STUDENT";
        }

        if (!role.equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("Access denied: Only students can enroll in courses.");
        }
        if (userId == null || courseId == null) {
            throw new RuntimeException("User ID and Course ID are required for enrollment.");
        }

        EnrollmentResponseDto response = enrollmentService.enrollStudent(userId, courseId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<EnrollmentResponseDto>> getEnrollmentsByUser(@PathVariable Long userId) {
        List<EnrollmentResponseDto> enrollments = enrollmentService.getEnrollmentsByUser(userId);
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponseDto>> getEnrollmentsByCourse(@PathVariable Long courseId) {
        List<EnrollmentResponseDto> enrollments = enrollmentService.getEnrollmentsByCourse(courseId);
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<List<EnrollmentResponseDto>> getEnrollmentsByInstructor(
            @PathVariable Long instructorId,
            @RequestParam(required = false) String role) {
        if (role != null && !role.equalsIgnoreCase("INSTRUCTOR")) {
            throw new RuntimeException("Access denied: Only instructors can view their enrollment analytics.");
        }
        List<EnrollmentResponseDto> enrollments = enrollmentService.getEnrollmentsByInstructor(instructorId);
        return ResponseEntity.ok(enrollments);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<EnrollmentResponseDto> updateEnrollmentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with ID: " + id));

        enrollment.setStatus(status.toUpperCase());
        Enrollment updated = enrollmentRepository.save(enrollment);

        EnrollmentResponseDto dto = new EnrollmentResponseDto();
        dto.setEnrollmentId(updated.getEnrollmentId());
        if (updated.getUser() != null) {
            dto.setUserId(updated.getUser().getUserId());
            dto.setUserName(updated.getUser().getName());
        }
        if (updated.getCourse() != null) {
            dto.setCourseId(updated.getCourse().getCourseId());
            dto.setCourseTitle(updated.getCourse().getTitle());
        }
        dto.setEnrolledAt(updated.getEnrolledAt());
        dto.setStatus(updated.getStatus());

        return ResponseEntity.ok(dto);
    }
}
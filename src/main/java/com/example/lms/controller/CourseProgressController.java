package com.example.lms.controller;

import com.example.lms.dto.ProgressRequestDto;
import com.example.lms.model.CourseProgress;
import com.example.lms.service.CourseProgressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
public class CourseProgressController {

    @Autowired
    private CourseProgressService progressService;

    @PostMapping("/complete")
    public ResponseEntity<?> markCourseAsComplete(@Valid @RequestBody ProgressRequestDto requestDto) {
        try {
            CourseProgress progress = progressService.markCourseAsComplete(requestDto);
            return ResponseEntity.ok(progress);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
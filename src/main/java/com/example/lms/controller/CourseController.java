package com.example.lms.controller;

import com.example.lms.dto.CourseRequestDto;
import com.example.lms.dto.CourseResponseDto;
import com.example.lms.model.Users;
import com.example.lms.service.CourseService;
import com.example.lms.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<CourseResponseDto> createCourse(
            @Valid @RequestBody CourseRequestDto dto,
            @RequestParam String role,
            HttpSession session) {
        if (role == null || !role.equalsIgnoreCase("INSTRUCTOR")) {
            throw new RuntimeException("Access denied: Only instructors can create courses.");
        }

        // Robust session check supporting both String emails and user objects/alternative keys
        Object sessionUser = session.getAttribute("user");
        String email = null;

        if (sessionUser instanceof String) {
            email = (String) sessionUser;
        } else if (sessionUser != null) {
            try {
                email = (String) sessionUser.getClass().getMethod("getEmail").invoke(sessionUser);
            } catch (Exception e) {
                email = sessionUser.toString();
            }
        }

        if (email == null) {
            email = (String) session.getAttribute("email");
        }

        if (email == null) {
            throw new RuntimeException("Unauthorized: Please log in again.");
        }

        Users instructor = userService.getUserByEmail(email);
        if (instructor == null) {
            throw new RuntimeException("Instructor not found.");
        }

        return ResponseEntity.ok(courseService.createCourse(dto, role, instructor.getUserId()));
    }

    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CourseResponseDto>> getCoursesByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(courseService.getCoursesByCategory(categoryId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(
            @PathVariable Long id,
            @RequestParam String role) {
        courseService.deleteCourse(id, role);
        return ResponseEntity.ok("Course deleted successfully!");
    }
}
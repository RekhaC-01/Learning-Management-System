package com.example.lms.service;

import com.example.lms.dto.CourseRequestDto;
import com.example.lms.dto.CourseResponseDto;
import com.example.lms.model.Category;
import com.example.lms.model.Course;
import com.example.lms.model.Users;
import com.example.lms.repository.CategoryRepository;
import com.example.lms.repository.CourseRepository;
import com.example.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    private void verifyInstructorRole(String role) {
        if (role == null || !role.equalsIgnoreCase("INSTRUCTOR")) {
            throw new RuntimeException("Access denied: Only INSTRUCTOR can perform this action.");
        }
    }

    private void verifyAdminOrInstructorRole(String role) {
        if (role == null || (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("INSTRUCTOR"))) {
            throw new RuntimeException("Access denied: Only ADMIN or INSTRUCTOR can perform this action.");
        }
    }

    public CourseResponseDto createCourse(CourseRequestDto dto, String role, Long instructorId) {
        verifyInstructorRole(role);

        // Enforce payment validation for instructor course listing
        if (dto.getPaymentTransactionId() == null || dto.getPaymentTransactionId().trim().isEmpty()) {
            throw new RuntimeException("Payment required: Instructors must complete a course listing payment transaction before publishing.");
        }

        if (courseRepository.existsByTitle(dto.getTitle())) {
            throw new RuntimeException("A course with the title '" + dto.getTitle() + "' already exists.");
        }

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + dto.getCategoryId()));

        Users instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor not found with ID: " + instructorId));

        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setCourseUrl(dto.getCourseUrl());
        course.setCategory(category);
        course.setUser(instructor); // Link course to instructor

        Course savedCourse = courseRepository.save(course);
        return mapToDto(savedCourse);
    }

    // Overloaded method to maintain backward compatibility if instructorId isn't passed directly
    public CourseResponseDto createCourse(CourseRequestDto dto, String role) {
        verifyInstructorRole(role);
        if (dto.getPaymentTransactionId() == null || dto.getPaymentTransactionId().trim().isEmpty()) {
            throw new RuntimeException("Payment required: Instructors must complete a course listing payment transaction before publishing.");
        }
        if (courseRepository.existsByTitle(dto.getTitle())) {
            throw new RuntimeException("A course with the title '" + dto.getTitle() + "' already exists.");
        }
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + dto.getCategoryId()));

        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setCourseUrl(dto.getCourseUrl());
        course.setCategory(category);

        Course savedCourse = courseRepository.save(course);
        return mapToDto(savedCourse);
    }

    public List<CourseResponseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CourseResponseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
        return mapToDto(course);
    }

    public List<CourseResponseDto> getCoursesByCategory(Long categoryId) {
        List<Course> courses = courseRepository.findByCategoryCategoryId(categoryId);
        return courses.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void deleteCourse(Long id, String role) {
        verifyAdminOrInstructorRole(role);
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found with ID: " + id);
        }
        courseRepository.deleteById(id);
    }

    private CourseResponseDto mapToDto(Course course) {
        CourseResponseDto dto = new CourseResponseDto();
        dto.setCourseId(course.getCourseId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setPrice(course.getPrice());
        dto.setCourseUrl(course.getCourseUrl());
        if (course.getCategory() != null) {
            dto.setCategoryName(course.getCategory().getCategoryName());
        }
        // Map average rating and total reviews so cards show correct statistics
        dto.setAverageRating(course.getAverageRating() != null ? course.getAverageRating() : 0.0);
        dto.setTotalReviews(course.getTotalReviews() != null ? course.getTotalReviews() : 0);
        return dto;
    }
}
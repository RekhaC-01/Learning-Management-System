package com.example.lms.service;

import com.example.lms.dto.EnrollmentResponseDto;
import com.example.lms.model.Course;
import com.example.lms.model.Enrollment;
import com.example.lms.model.Users;
import com.example.lms.repository.CourseRepository;
import com.example.lms.repository.EnrollmentRepository;
import com.example.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    public EnrollmentResponseDto enrollStudent(Long userId, Long courseId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));

        boolean alreadyEnrolled = enrollmentRepository.existsByUserUserIdAndCourseCourseId(userId, courseId);
        if (alreadyEnrolled) {
            throw new RuntimeException("User is already enrolled in this course.");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return mapToDto(savedEnrollment);
    }

    public List<EnrollmentResponseDto> getEnrollmentsByUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        return enrollmentRepository.findByUserUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<EnrollmentResponseDto> getEnrollmentsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found with ID: " + courseId);
        }
        return enrollmentRepository.findByCourseCourseId(courseId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<EnrollmentResponseDto> getEnrollmentsByInstructor(Long instructorId) {
        return enrollmentRepository.findAll().stream()
                .filter(e -> e.getCourse() != null && isCourseOwnedByInstructor(e.getCourse(), instructorId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private boolean isCourseOwnedByInstructor(Course course, Long instructorId) {
        if (course == null || instructorId == null) return false;
        Class<?> clazz = course.getClass();

        // Try standard getter methods on Course
        for (String methodName : new String[]{"getUser", "getInstructor", "getCreator", "getOwner", "getUserId", "getInstructorId"}) {
            try {
                Method m = clazz.getMethod(methodName);
                Object val = m.invoke(course);
                if (val != null) {
                    if (val instanceof Users || val.getClass().getName().toLowerCase().contains("user")) {
                        // Try both getUserId() and getId() on the user/instructor object
                        Object id = invokeIdMethod(val);
                        if (instructorId.equals(id)) return true;
                    } else if (val instanceof Number) {
                        if (instructorId.equals(((Number) val).longValue())) return true;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Try direct field access as a fallback
        for (String fieldName : new String[]{"user", "instructor", "creator", "owner", "userId", "instructorId"}) {
            try {
                Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);
                Object val = field.get(course);
                if (val != null) {
                    if (val instanceof Users || val.getClass().getName().toLowerCase().contains("user")) {
                        Object id = invokeIdMethod(val);
                        if (instructorId.equals(id)) return true;
                    } else if (val instanceof Number) {
                        if (instructorId.equals(((Number) val).longValue())) return true;
                    }
                }
            } catch (Exception ignored) {}
        }

        return false;
    }

    private Object invokeIdMethod(Object target) {
        for (String idMethodName : new String[]{"getUserId", "getId", "getInstructorId"}) {
            try {
                Method idMethod = target.getClass().getMethod(idMethodName);
                Object idVal = idMethod.invoke(target);
                if (idVal instanceof Number) {
                    return ((Number) idVal).longValue();
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private EnrollmentResponseDto mapToDto(Enrollment enrollment) {
        EnrollmentResponseDto dto = new EnrollmentResponseDto();
        dto.setEnrollmentId(enrollment.getEnrollmentId());
        if (enrollment.getUser() != null) {
            dto.setUserId(enrollment.getUser().getUserId());
            dto.setUserName(enrollment.getUser().getName());
        }
        if (enrollment.getCourse() != null) {
            dto.setCourseId(enrollment.getCourse().getCourseId());
            dto.setCourseTitle(enrollment.getCourse().getTitle());
        }
        dto.setEnrolledAt(enrollment.getEnrolledAt());
        dto.setStatus(enrollment.getStatus());
        return dto;
    }
}
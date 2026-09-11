package com.example.lms.service;

import com.example.lms.dto.ProgressRequestDto;
import com.example.lms.model.Course;
import com.example.lms.model.CourseProgress;
import com.example.lms.model.Users;
import com.example.lms.repository.CourseProgressRepository;
import com.example.lms.repository.CourseRepository;
import com.example.lms.repository.EnrollmentRepository;
import com.example.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CourseProgressService {

    @Autowired
    private CourseProgressRepository progressRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Transactional
    public CourseProgress markCourseAsComplete(ProgressRequestDto requestDto) {
        Long userId = requestDto.getUserId();
        Long courseId = requestDto.getCourseId();

        // 1. Validate that the user exists
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // 2. Validate that the course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + courseId));

        // 3. CRITICAL VALIDATION: Verify that the user has an active enrollment
        boolean isEnrolled = enrollmentRepository.existsByUserUserIdAndCourseCourseId(userId, courseId);
        if (!isEnrolled) {
            throw new IllegalStateException("Access denied: User must be enrolled in the course to track progress.");
        }

        // 4. Find or create the progress record
        CourseProgress progress = progressRepository.findByUserUserIdAndCourseCourseId(userId, courseId)
                .orElseGet(() -> {
                    CourseProgress newProgress = new CourseProgress();
                    newProgress.setUser(user);
                    newProgress.setCourse(course);
                    return newProgress;
                });

        // 5. Update status if not already completed
        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
        }

        return progressRepository.save(progress);
    }
}
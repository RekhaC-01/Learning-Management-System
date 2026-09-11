package com.example.lms.repository;

import com.example.lms.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByUserUserId(Long userId);

    List<Enrollment> findByUser_UserId(Long userId);

    List<Enrollment> findByCourseCourseId(Long courseId);

    boolean existsByUserUserIdAndCourseCourseId(Long userId, Long courseId);
}
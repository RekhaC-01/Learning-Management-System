package com.example.lms.repository;

import com.example.lms.model.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {

    @Query("SELECT cp FROM CourseProgress cp WHERE cp.user.userId = :userId AND cp.course.courseId = :courseId")
    Optional<CourseProgress> findByUserUserIdAndCourseCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
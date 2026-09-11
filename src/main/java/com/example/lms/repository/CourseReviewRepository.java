package com.example.lms.repository;

import com.example.lms.model.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {
    List<CourseReview> findByCourse_CourseId(Long courseId);
    List<CourseReview> findByUser_UserId(Long userId);
    Optional<CourseReview> findByUser_UserIdAndCourse_CourseId(Long userId, Long courseId);

    @Query("SELECT AVG(r.rating) FROM CourseReview r WHERE r.course.courseId = :courseId")
    Double calculateAverageRatingByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("DELETE FROM CourseReview r WHERE r.user.userId = :userId")
    void deleteByUser_UserId(@Param("userId") Long userId);
}
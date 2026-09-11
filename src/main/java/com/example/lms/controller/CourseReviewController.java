package com.example.lms.controller;

import com.example.lms.model.Course;
import com.example.lms.model.CourseReview;
import com.example.lms.model.Users;
import com.example.lms.repository.CourseRepository;
import com.example.lms.repository.CourseReviewRepository;
import com.example.lms.repository.EnrollmentRepository;
import com.example.lms.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/reviews", "/reviews"})
//@CrossOrigin(origins = "*")
public class CourseReviewController {

    @Autowired
    private CourseReviewRepository reviewRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload, HttpSession session) {
        try {
            Long resolvedUserId = null;

            Object rawUserId = payload.get("userId");
            if (rawUserId == null) rawUserId = payload.get("user_id");
            if (rawUserId == null) rawUserId = payload.get("studentId");

            if (rawUserId != null) {
                try {
                    resolvedUserId = Long.valueOf(rawUserId.toString());
                } catch (NumberFormatException ignored) {}
            }

            if (resolvedUserId == null) {
                Object sessionUser = session.getAttribute("user");
                String email = null;

                if (sessionUser instanceof String) {
                    email = (String) sessionUser;
                } else if (sessionUser != null) {
                    try {
                        Method getEmailMethod = sessionUser.getClass().getMethod("getEmail");
                        email = (String) getEmailMethod.invoke(sessionUser);
                    } catch (Exception e) {
                        email = sessionUser.toString();
                    }
                }

                if (email == null) {
                    email = (String) session.getAttribute("email");
                }

                if (email != null) {
                    Users loggedInUser = userRepository.findByEmail(email).orElse(null);
                    if (loggedInUser != null) {
                        resolvedUserId = loggedInUser.getUserId();
                    }
                }
            }

            Long resolvedCourseId = null;
            Object rawCourseId = payload.get("courseId");
            if (rawCourseId == null) rawCourseId = payload.get("course_id");
            if (rawCourseId != null) {
                try {
                    resolvedCourseId = Long.valueOf(rawCourseId.toString());
                } catch (NumberFormatException ignored) {}
            }

            Integer rating = null;
            Object rawRating = payload.get("rating");
            if (rawRating != null) {
                try {
                    rating = Integer.valueOf(rawRating.toString());
                } catch (NumberFormatException ignored) {}
            }

            if (resolvedUserId == null || resolvedCourseId == null || rating == null) {
                return ResponseEntity.badRequest().body("Missing required fields: userId/session, courseId, or rating.");
            }

            final Long userId = resolvedUserId;
            final Long courseId = resolvedCourseId;

            String comment = (String) payload.getOrDefault("comment", "");
            if (comment == null) comment = "";

            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Rating must be between 1 and 5 stars.");
            }

            boolean isEnrolled = enrollmentRepository.existsByUserUserIdAndCourseCourseId(userId, courseId);

            if (!isEnrolled) {
                return ResponseEntity.status(403).body("You must purchase/enroll in the course before reviewing.");
            }

            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));

            CourseReview review = reviewRepository.findByUser_UserIdAndCourse_CourseId(userId, courseId)
                    .orElse(new CourseReview(user, course, rating, comment));

            review.setRating(rating);
            review.setComment(comment);
            reviewRepository.save(review);

            Double avgRating = reviewRepository.calculateAverageRatingByCourseId(courseId);
            List<CourseReview> allCourseReviews = reviewRepository.findByCourse_CourseId(courseId);

            double finalAvg = avgRating != null ? avgRating : 0.0;
            double roundedAvg = Math.round(finalAvg * 10.0) / 10.0;
            int totalReviewsCount = allCourseReviews.size();

            course.setAverageRating(roundedAvg);
            course.setTotalReviews(totalReviewsCount); // Direct call since setTotalReviews is confirmed in Course.java

            courseRepository.save(course);

            return ResponseEntity.ok(Map.of(
                    "message", "Review submitted successfully",
                    "averageRating", course.getAverageRating(),
                    "totalReviews", course.getTotalReviews()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @GetMapping("/course/{courseId}")
    public List<CourseReview> getReviewsForCourse(@PathVariable Long courseId) {
        return reviewRepository.findByCourse_CourseId(courseId);
    }

    @GetMapping("/student/{userId}")
    public List<CourseReview> getReviewsByStudent(@PathVariable Long userId) {
        return reviewRepository.findByUser_UserId(userId);
    }
}
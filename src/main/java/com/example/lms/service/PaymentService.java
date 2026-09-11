package com.example.lms.service;

import com.example.lms.dto.PaymentRequestDto;
import com.example.lms.dto.PaymentResponseDto;
import com.example.lms.model.Course;
import com.example.lms.model.Enrollment;
import com.example.lms.model.Payment;
import com.example.lms.model.Users;
import com.example.lms.repository.CourseRepository;
import com.example.lms.repository.EnrollmentRepository;
import com.example.lms.repository.PaymentRepository;
import com.example.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    private static final double FIXED_INSTRUCTOR_FEE = 9999.0;

    public PaymentResponseDto processPayment(PaymentRequestDto dto, String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new RuntimeException("Role parameter is required.");
        }

        Users user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionId("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaymentDate(LocalDateTime.now());

        if (role.equalsIgnoreCase("INSTRUCTOR")) {
            if (dto.getAmount() == null || !dto.getAmount().equals(FIXED_INSTRUCTOR_FEE)) {
                throw new RuntimeException("Instructor platform fee must be exactly " + FIXED_INSTRUCTOR_FEE);
            }

            boolean alreadyPaid = paymentRepository.existsByUserUserIdAndPaymentTypeAndPaymentStatus(
                    dto.getUserId(), "INSTRUCTOR_PLATFORM_FEE", "SUCCESS"
            );

            if (alreadyPaid) {
                throw new RuntimeException("Payment already done. You have already paid your instructor platform fee.");
            }

            payment.setPaymentType("INSTRUCTOR_PLATFORM_FEE");
            payment.setAmount(dto.getAmount());
            payment.setCourse(null);

        } else if (role.equalsIgnoreCase("STUDENT")) {
            if (dto.getCourseId() == null) {
                throw new RuntimeException("Course ID is required for student course purchases.");
            }

            Course course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found with ID: " + dto.getCourseId()));

            boolean alreadyPurchased = paymentRepository.existsByUserUserIdAndCourseCourseIdAndPaymentStatus(
                    dto.getUserId(), dto.getCourseId(), "SUCCESS"
            );

            if (alreadyPurchased) {
                throw new RuntimeException("Payment already done for this course. You already own it.");
            }

            if (!dto.getAmount().equals(course.getPrice())) {
                throw new RuntimeException("Payment amount does not match the course price set by the instructor.");
            }

            payment.setPaymentType("STUDENT_COURSE_PURCHASE");
            payment.setAmount(dto.getAmount());
            payment.setCourse(course);

            Payment savedPayment = paymentRepository.save(payment);

            boolean alreadyEnrolled = enrollmentRepository.existsByUserUserIdAndCourseCourseId(user.getUserId(), course.getCourseId());
            if (!alreadyEnrolled) {
                Enrollment enrollment = new Enrollment();
                enrollment.setUser(user);
                enrollment.setCourse(course);
                enrollmentRepository.save(enrollment);
            }

            return mapToDto(savedPayment);

        } else {
            throw new RuntimeException("Invalid role specified. Allowed roles for payments are INSTRUCTOR or STUDENT.");
        }

        Payment savedPayment = paymentRepository.save(payment);
        return mapToDto(savedPayment);
    }

    public List<PaymentResponseDto> getPaymentsByUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        return paymentRepository.findByUserUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private PaymentResponseDto mapToDto(Payment payment) {
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.setPaymentId(payment.getPaymentId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentStatus(payment.getPaymentStatus());
        dto.setTransactionId(payment.getTransactionId());
        dto.setPaymentType(payment.getPaymentType());
        dto.setPaymentDate(payment.getPaymentDate());
        if (payment.getUser() != null) {
            dto.setUserName(payment.getUser().getName());
        }
        if (payment.getCourse() != null) {
            dto.setCourseTitle(payment.getCourse().getTitle());
        }
        return dto;
    }
}
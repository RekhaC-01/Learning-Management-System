package com.example.lms.repository;

import com.example.lms.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserUserId(Long userId);

    boolean existsByUserUserIdAndCourseCourseIdAndPaymentStatus(Long userId, Long courseId, String paymentStatus);
    boolean existsByUserUserIdAndPaymentTypeAndPaymentStatus(Long userId, String paymentType, String paymentStatus);
}
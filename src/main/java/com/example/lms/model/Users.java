package com.example.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class Users {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "user_id")
        private Long userId;

        @Column(nullable = false, unique = true, length = 20)
        private String phoneNumber;

        @Column(nullable = false, length = 100)
        private String name;

        @Column(nullable = false, unique = true, length = 150)
        private String email;

        @Column(name = "password", nullable = false)
        private String password;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private Role role;

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @JsonIgnore
        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Enrollment> enrollments = new ArrayList<>();

        @JsonIgnore
        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<CourseProgress> courseProgresses = new ArrayList<>();

        @JsonIgnore
        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Payment> payments = new ArrayList<>();

        public enum Role {
                STUDENT, INSTRUCTOR, ADMIN
        }

        public Users() {}

        public Users(Long userId, String name, String phoneNumber, String email, String password, Role role, LocalDateTime createdAt) {
                this.userId = userId;
                this.name = name;
                this.phoneNumber = phoneNumber;
                this.email = email;
                this.password = password;
                this.role = role;
                this.createdAt = createdAt;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public List<Enrollment> getEnrollments() { return enrollments; }
        public void setEnrollments(List<Enrollment> enrollments) { this.enrollments = enrollments; }

        public List<CourseProgress> getCourseProgresses() { return courseProgresses; }
        public void setCourseProgresses(List<CourseProgress> courseProgresses) { this.courseProgresses = courseProgresses; }

        public List<Payment> getPayments() { return payments; }
        public void setPayments(List<Payment> payments) { this.payments = payments; }
}
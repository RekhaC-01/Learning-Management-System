package com.example.lms.service;

import com.example.lms.dto.UserLoginDto;
import com.example.lms.dto.UserLoginResponseDTO;
import com.example.lms.dto.UserRegistrationDto;
import com.example.lms.model.Users;
import com.example.lms.repository.CourseReviewRepository;
import com.example.lms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final CourseReviewRepository courseReviewRepository;

    public UserService(UserRepository userRepository, CourseReviewRepository courseReviewRepository) {
        this.userRepository = userRepository;
        this.courseReviewRepository = courseReviewRepository;
    }

    public UserLoginResponseDTO registerUser(UserRegistrationDto registrationDto) {
        if (userRepository.findByEmail(registrationDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use!");
        }

        if (userRepository.existsByPhoneNumber(registrationDto.getPhoneNumber())) {
            throw new RuntimeException("Phone number is already in use!");
        }

        Users user = new Users();
        user.setName(registrationDto.getName());
        user.setPhoneNumber(registrationDto.getPhoneNumber());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(registrationDto.getPassword());
        user.setRole(registrationDto.getRole());

        userRepository.save(user);

        return new UserLoginResponseDTO("User registered successfully!");
    }

    public UserLoginResponseDTO loginUser(UserLoginDto loginDto) {
        Users user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found. Please register first!"));

        if (!loginDto.getPassword().equals(user.getPassword())) {
            throw new RuntimeException("Invalid password!");
        }

        return new UserLoginResponseDTO("Login successful!");
    }

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public List<Users> getAllUsers(String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            throw new RuntimeException("Access denied: Only ADMIN can view all users.");
        }
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long userId, String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            throw new RuntimeException("Access denied: Only ADMIN can delete users.");
        }

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with ID: " + userId);
        }

        // Delete associated course reviews first to prevent foreign key constraint violations
        courseReviewRepository.deleteByUser_UserId(userId);

        userRepository.deleteById(userId);
    }
}
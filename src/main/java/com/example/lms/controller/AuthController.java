package com.example.lms.controller;

import com.example.lms.dto.UserLoginDto;
import com.example.lms.dto.UserLoginResponseDTO;
import com.example.lms.dto.UserRegistrationDto;
import com.example.lms.dto.UserRegistrationResponseDTO;
import com.example.lms.model.Users;
import com.example.lms.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    private boolean isValidEmailDomain(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        List<String> allowedDomains = List.of("gmail.com", "yahoo.com", "outlook.com", "hotmail.com");
        String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
        return allowedDomains.contains(domain);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMessage = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", errorMessage));
        }
        if (!isValidEmailDomain(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new UserRegistrationResponseDTO("Please use a valid email provider (gmail.com, yahoo.com, outlook.com, hotmail.com)"));
        }
        userService.registerUser(request);

        UserRegistrationResponseDTO responseDTO = new UserRegistrationResponseDTO("Registration successful");
        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLoginDto request, BindingResult bindingResult, HttpSession session) {
        if (bindingResult.hasErrors()) {
            String errorMessage = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", errorMessage));
        }
        if (!isValidEmailDomain(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new UserLoginResponseDTO("Please use a valid email provider (gmail.com, yahoo.com, outlook.com, hotmail.com)"));
        }
        userService.loginUser(request);

        // Store email in session
        session.setAttribute("user", request.getEmail());

        UserLoginResponseDTO responseDTO = new UserLoginResponseDTO("Login successful");
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        String email = (String) session.getAttribute("user");

        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not logged in"));
        }

        Users user = userService.getUserByEmail(email);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestParam String role) {
        try {
            List<Users> users = userService.getAllUsers(role);
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestParam String role) {
        try {
            userService.deleteUser(id, role);
            return ResponseEntity.ok("User deleted successfully.");
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}
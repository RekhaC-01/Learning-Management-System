package com.example.lms.controller;

import com.example.lms.dto.CategoryRequestDto;
import com.example.lms.dto.CategoryResponseDto;
import com.example.lms.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<?> createCategory(
            @Valid @RequestBody CategoryRequestDto requestDto,
            @RequestParam String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return new ResponseEntity<>("Access denied: Only admins can create categories.", HttpStatus.FORBIDDEN);
        }
        try {
            CategoryResponseDto response = categoryService.createCategory(requestDto, role);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage().contains("already exists") ? HttpStatus.BAD_REQUEST : HttpStatus.FORBIDDEN;
            return new ResponseEntity<>(e.getMessage(), status);
        }
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {
        List<CategoryResponseDto> categories = categoryService.getAllCategories();
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        try {
            CategoryResponseDto response = categoryService.getCategoryById(id);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDto requestDto,
            @RequestParam String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return new ResponseEntity<>("Access denied: Only admins can update categories.", HttpStatus.FORBIDDEN);
        }
        try {
            CategoryResponseDto response = categoryService.updateCategory(id, requestDto, role);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage().contains("already exists") ? HttpStatus.BAD_REQUEST : HttpStatus.FORBIDDEN;
            return new ResponseEntity<>(e.getMessage(), status);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestParam String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return new ResponseEntity<>("Access denied: Only admins can delete categories.", HttpStatus.FORBIDDEN);
        }
        try {
            categoryService.deleteCategory(id, role);
            return new ResponseEntity<>("Category deleted successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}
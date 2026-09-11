package com.example.lms.service;

import com.example.lms.dto.CategoryRequestDto;
import com.example.lms.dto.CategoryResponseDto;
import com.example.lms.model.Category;
import com.example.lms.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    private void verifyAdminRole(String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            throw new RuntimeException("Access denied: Only ADMIN can perform this action.");
        }
    }

    public CategoryResponseDto createCategory(CategoryRequestDto dto, String role) {
        verifyAdminRole(role);

        // Check if category name already exists
        boolean exists = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase(dto.getCategoryName()));
        if (exists) {
            throw new RuntimeException("Category already exists with name: " + dto.getCategoryName());
        }

        Category category = new Category();
        category.setCategoryName(dto.getCategoryName());
        category.setDescription(dto.getDescription());

        Category savedCategory = categoryRepository.save(category);
        return mapToDto(savedCategory);
    }

    public List<CategoryResponseDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CategoryResponseDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
        return mapToDto(category);
    }

    public CategoryResponseDto updateCategory(Long id, CategoryRequestDto dto, String role) {
        verifyAdminRole(role);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        // Optional: Check for duplicate name during update (excluding the current category)
        boolean nameExists = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase(dto.getCategoryName()) && !c.getCategoryId().equals(id));
        if (nameExists) {
            throw new RuntimeException("Category already exists with name: " + dto.getCategoryName());
        }

        category.setCategoryName(dto.getCategoryName());
        category.setDescription(dto.getDescription());

        Category updatedCategory = categoryRepository.save(category);
        return mapToDto(updatedCategory);
    }

    public void deleteCategory(Long id, String role) {
        verifyAdminRole(role);

        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with ID: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryResponseDto mapToDto(Category category) {
        CategoryResponseDto dto = new CategoryResponseDto();
        dto.setCategoryId(category.getCategoryId());
        dto.setCategoryName(category.getCategoryName());
        dto.setDescription(category.getDescription());
        return dto;
    }
}
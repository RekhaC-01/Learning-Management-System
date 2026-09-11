package com.example.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CategoryRequestDto {

        @NotBlank(message = "Category name cannot be blank")
        @Size(min = 2, max = 50, message = "Category name must be between 2 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z ]+$", message = "Category name must contain only letters and spaces")
        private String categoryName;

        private String description;

        public CategoryRequestDto() {
        }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

package com.example.lms.dto;

public class CategoryResponseDto {
    private Long categoryId;
    private String categoryName;
    private String description;
    private String message;

    public CategoryResponseDto() {
    }

    public CategoryResponseDto(Long categoryId, String categoryName, String description, String message) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.description = description;
        this.message = message;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
package com.example.lms.dto;

public class UserRegistrationResponseDTO {
    private String message;

    public UserRegistrationResponseDTO(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
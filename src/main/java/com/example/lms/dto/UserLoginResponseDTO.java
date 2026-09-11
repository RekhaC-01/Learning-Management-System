package com.example.lms.dto;

public class UserLoginResponseDTO {
    private String message;

    public UserLoginResponseDTO(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

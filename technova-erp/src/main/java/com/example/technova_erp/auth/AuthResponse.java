
package com.example.technova_erp.auth;

public class AuthResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String message;
    private String accessToken;
    private String tokenType;
    private Long expiresIn;

    public AuthResponse(
            Long id,
            String name,
            String email,
            String role,
            String message,
            String accessToken,
            String tokenType,
            Long expiresIn) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.message = message;
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getMessage() { return message; }
    public String getAccessToken() { return accessToken; }
    public String getTokenType() { return tokenType; }
    public Long getExpiresIn() { return expiresIn; }
}

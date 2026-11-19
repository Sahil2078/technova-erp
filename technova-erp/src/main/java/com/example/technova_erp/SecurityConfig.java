
package com.example.technova_erp;

import com.example.technova_erp.security.JwtAuthenticationFilter;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .exceptionHandling(ex -> ex

                        .authenticationEntryPoint(
                                (request, response, authException) -> {
                                    response.setStatus(
                                            HttpStatus.UNAUTHORIZED.value()
                                    );
                                    response.setContentType(
                                            MediaType.APPLICATION_JSON_VALUE
                                    );
                                    response.getWriter().write(
                                            "{\"error\":\"Authentication required or invalid token\"}"
                                    );
                                }
                        )

                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {
                                    response.setStatus(
                                            HttpStatus.FORBIDDEN.value()
                                    );
                                    response.setContentType(
                                            MediaType.APPLICATION_JSON_VALUE
                                    );
                                    response.getWriter().write(
                                            "{\"error\":\"Access denied: insufficient permissions\"}"
                                    );
                                }
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .dispatcherTypeMatchers(
                                DispatcherType.ERROR,
                                DispatcherType.FORWARD
                        ).permitAll()

                        // Public authentication endpoints
                        .requestMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login"
                        ).permitAll()

                        // Product and inventory read access
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/inventory",
                                "/api/v1/inventory/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        // Product and inventory modifications
                        .requestMatchers(
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/inventory",
                                "/api/v1/inventory/**"
                        ).hasRole("ADMIN")

                        // Supplier and purchase order management
                        .requestMatchers(
                                "/api/v1/suppliers",
                                "/api/v1/suppliers/**",
                                "/api/v1/purchase-orders",
                                "/api/v1/purchase-orders/**"
                        ).hasRole("ADMIN")

                        // Customer read and create access
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/v1/customers",
                                "/api/v1/customers/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/v1/customers"
                        ).hasAnyRole("ADMIN", "STAFF")

                        // Customer modifications
                        .requestMatchers(
                                "/api/v1/customers",
                                "/api/v1/customers/**"
                        ).hasRole("ADMIN")

                        // Sales order confirmation: ADMIN only
                        .requestMatchers(
                                org.springframework.http.HttpMethod.PATCH,
                                "/api/v1/sales-orders/*/confirm"
                        ).hasRole("ADMIN")

                        // Sales order read and create: ADMIN or STAFF
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/v1/sales-orders",
                                "/api/v1/sales-orders/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/v1/sales-orders"
                        ).hasAnyRole("ADMIN", "STAFF")

                        // Any other sales order operations: ADMIN
                        .requestMatchers(
                                "/api/v1/sales-orders",
                                "/api/v1/sales-orders/**"
                        ).hasRole("ADMIN")
                        // Dashboard - ADMIN only
                        .requestMatchers(
                                "/api/v1/dashboard",
                                "/api/v1/dashboard/**"
                        ).hasRole("ADMIN")

                        .requestMatchers("/api/v1/reports/**")
                        .hasRole("ADMIN")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}

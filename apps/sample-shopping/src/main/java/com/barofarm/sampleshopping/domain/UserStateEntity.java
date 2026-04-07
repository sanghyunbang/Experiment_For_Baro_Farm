package com.barofarm.sampleshopping.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserStateEntity {

    @Id
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 20)
    private String state;

    protected UserStateEntity() {
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getState() {
        return state;
    }
}

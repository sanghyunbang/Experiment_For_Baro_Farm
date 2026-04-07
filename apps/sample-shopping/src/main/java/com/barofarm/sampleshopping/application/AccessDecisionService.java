package com.barofarm.sampleshopping.application;

import com.barofarm.sampleshopping.config.AuthMode;
import com.barofarm.sampleshopping.config.ExperimentProperties;
import com.barofarm.sampleshopping.domain.UserStateEntity;
import com.barofarm.sampleshopping.infrastructure.persistence.UserStateRepository;
import org.springframework.stereotype.Service;

@Service
public class AccessDecisionService {

    private final ExperimentProperties properties;
    private final UserStateRepository userStateRepository;

    public AccessDecisionService(
            ExperimentProperties properties,
            UserStateRepository userStateRepository
    ) {
        this.properties = properties;
        this.userStateRepository = userStateRepository;
    }

    public boolean canAccessCart(String userId, String userRole, String userState) {
        AuthMode authMode = properties.getAuthMode();

        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return true;
        }

        if (authMode == AuthMode.OPA_ONLY) {
            return "ACTIVE".equalsIgnoreCase(userState);
        }

        UserStateEntity user = userStateRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        return "ACTIVE".equalsIgnoreCase(user.getState());
    }
}

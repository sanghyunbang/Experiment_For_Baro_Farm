package com.barofarm.sampleshopping.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "experiment")
public class ExperimentProperties {

    private AuthMode authMode = AuthMode.DB_ONLY;

    public AuthMode getAuthMode() {
        return authMode;
    }

    public void setAuthMode(AuthMode authMode) {
        this.authMode = authMode;
    }
}

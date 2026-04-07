package com.barofarm.sampleshopping.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ExperimentProperties.class)
public class ExperimentConfig {
}

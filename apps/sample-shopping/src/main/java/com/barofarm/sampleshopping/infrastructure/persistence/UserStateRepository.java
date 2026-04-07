package com.barofarm.sampleshopping.infrastructure.persistence;

import com.barofarm.sampleshopping.domain.UserStateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStateRepository extends JpaRepository<UserStateEntity, String> {
}

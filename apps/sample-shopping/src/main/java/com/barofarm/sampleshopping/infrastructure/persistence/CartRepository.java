package com.barofarm.sampleshopping.infrastructure.persistence;

import com.barofarm.sampleshopping.domain.CartEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<CartEntity, Long> {

    List<CartEntity> findByOwnerUserId(String ownerUserId);
}

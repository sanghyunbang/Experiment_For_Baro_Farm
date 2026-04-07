package com.barofarm.sampleshopping.application;

import com.barofarm.sampleshopping.domain.CartEntity;
import com.barofarm.sampleshopping.infrastructure.persistence.CartRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CartService {

    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    public List<CartEntity> getCarts(String userId, String userRole) {
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return cartRepository.findAll();
        }
        return cartRepository.findByOwnerUserId(userId);
    }
}

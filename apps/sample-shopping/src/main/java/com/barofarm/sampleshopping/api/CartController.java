package com.barofarm.sampleshopping.api;

import com.barofarm.sampleshopping.application.AccessDecisionService;
import com.barofarm.sampleshopping.application.CartService;
import com.barofarm.sampleshopping.domain.CartEntity;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/carts")
public class CartController {

    private final AccessDecisionService accessDecisionService;
    private final CartService cartService;

    public CartController(
            AccessDecisionService accessDecisionService,
            CartService cartService
    ) {
        this.accessDecisionService = accessDecisionService;
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartResponse> getCarts(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestHeader(value = "X-User-State", defaultValue = "ACTIVE") String userState
    ) {
        if (!accessDecisionService.canAccessCart(userId, userRole, userState)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return cartService.getCarts(userId, userRole).stream()
                .map(CartResponse::from)
                .toList();
    }

    public record CartResponse(
            Long cartId,
            String ownerUserId,
            String status,
            BigDecimal totalAmount
    ) {
        static CartResponse from(CartEntity entity) {
            return new CartResponse(
                    entity.getCartId(),
                    entity.getOwnerUserId(),
                    entity.getStatus(),
                    entity.getTotalAmount()
            );
        }
    }
}

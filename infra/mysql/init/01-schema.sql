CREATE TABLE IF NOT EXISTS users (
    user_id     VARCHAR(36)   PRIMARY KEY,
    role        VARCHAR(20)   NOT NULL,
    state       VARCHAR(20)   NOT NULL,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS carts (
    cart_id       BIGINT         PRIMARY KEY AUTO_INCREMENT,
    owner_user_id VARCHAR(36)    NOT NULL,
    status        VARCHAR(20)    NOT NULL,
    total_amount  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS user_access_policy (
    id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id       VARCHAR(36)  NOT NULL,
    resource_type VARCHAR(30)  NOT NULL,
    resource_id   VARCHAR(50)  NOT NULL,
    allowed       TINYINT(1)   NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO users (user_id, role, state) VALUES
('user-a',  'CUSTOMER', 'ACTIVE'),
('user-b',  'CUSTOMER', 'SUSPENDED'),
('admin-1', 'ADMIN',    'ACTIVE');

INSERT INTO carts (owner_user_id, status, total_amount) VALUES
('user-a', 'OPEN', 12000),
('user-b', 'OPEN', 8000);

INSERT INTO user_access_policy (user_id, resource_type, resource_id, allowed) VALUES
('user-a', 'CART', 'SELF', 1),
('user-b', 'CART', 'SELF', 0);
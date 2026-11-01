– =========================================
– LAGOS LEGENDS
– STAGE 8.1: PLAYER ECONOMY FOUNDATION
– PostgreSQL / Supabase
– =========================================

– =========================================
– 1. PLAYERS
– =========================================

CREATE TABLE IF NOT EXISTS players (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

username VARCHAR(24) UNIQUE NOT NULL,
character_name VARCHAR(40),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 2. PLAYER WALLETS
– =========================================

CREATE TABLE IF NOT EXISTS player_wallets (
player_id UUID PRIMARY KEY
REFERENCES players(id) ON DELETE CASCADE,

cash BIGINT NOT NULL DEFAULT 50000
    CHECK (cash >= 0),
bank BIGINT NOT NULL DEFAULT 0
    CHECK (bank >= 0),
starter_grant_claimed BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 3. FINANCIAL TRANSACTIONS
– =========================================

CREATE TABLE IF NOT EXISTS transactions (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

player_id UUID NOT NULL
    REFERENCES players(id) ON DELETE CASCADE,
transaction_type VARCHAR(30) NOT NULL,
amount BIGINT NOT NULL CHECK (amount > 0),
source VARCHAR(20),
destination VARCHAR(20),
description TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 4. PLAYER NEEDS
– =========================================

CREATE TABLE IF NOT EXISTS player_needs (
player_id UUID PRIMARY KEY
REFERENCES players(id) ON DELETE CASCADE,

hunger SMALLINT NOT NULL DEFAULT 100
    CHECK (hunger BETWEEN 0 AND 100),
active_seconds BIGINT NOT NULL DEFAULT 0
    CHECK (active_seconds >= 0),
last_active_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 5. ITEMS
– =========================================

CREATE TABLE IF NOT EXISTS items (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

name VARCHAR(80) NOT NULL,
category VARCHAR(30) NOT NULL,
description TEXT,
price BIGINT NOT NULL DEFAULT 0
    CHECK (price >= 0),
hunger_restore SMALLINT NOT NULL DEFAULT 0
    CHECK (hunger_restore BETWEEN 0 AND 100),
created_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 6. PLAYER INVENTORY
– =========================================

CREATE TABLE IF NOT EXISTS player_inventory (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

player_id UUID NOT NULL
    REFERENCES players(id) ON DELETE CASCADE,
item_id BIGINT NOT NULL
    REFERENCES items(id),
quantity INTEGER NOT NULL DEFAULT 1
    CHECK (quantity > 0),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(player_id, item_id)

);

– =========================================
– 7. BUSINESSES
– =========================================

CREATE TABLE IF NOT EXISTS businesses (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

name VARCHAR(100) NOT NULL,
business_type VARCHAR(40) NOT NULL,
description TEXT,
location_x DOUBLE PRECISION,
location_z DOUBLE PRECISION,
is_open BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW()

);

– =========================================
– 8. BUSINESS INVENTORY
– =========================================

CREATE TABLE IF NOT EXISTS business_inventory (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

business_id BIGINT NOT NULL
    REFERENCES businesses(id) ON DELETE CASCADE,
item_id BIGINT NOT NULL
    REFERENCES items(id),
price BIGINT NOT NULL CHECK (price >= 0),
stock INTEGER NOT NULL DEFAULT -1
    CHECK (stock >= -1),
UNIQUE(business_id, item_id)

);

– =========================================
– 9. INDEXES
– =========================================

CREATE INDEX IF NOT EXISTS idx_transactions_player
ON transactions(player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_player
ON player_inventory(player_id);

CREATE INDEX IF NOT EXISTS idx_business_type
ON businesses(business_type);

– =========================================
– END OF STAGE 8.1 FOUNDATION
– =========================================

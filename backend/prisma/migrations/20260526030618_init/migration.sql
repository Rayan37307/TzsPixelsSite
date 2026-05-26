-- CreateTable
CREATE TABLE "bots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "system_instruction" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#10b981',
    "welcome_message" TEXT NOT NULL DEFAULT 'Hello! How can I help you?',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'facebook',
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "profile_pic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ai_mode" BOOLEAN NOT NULL DEFAULT true,
    "assigned_to" TEXT,
    "last_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender" TEXT NOT NULL,
    "sender_id" TEXT,
    "sender_name" TEXT,
    "content" TEXT NOT NULL,
    "platform_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "total_price" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "status" TEXT,
    "refund_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_number" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "billing_country" TEXT,
    "shipping_country" TEXT,
    "shipping_address" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_level" TEXT NOT NULL DEFAULT 'safe',
    "red_flags" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_platform_user_id_platform_key" ON "conversations"("platform_user_id", "platform");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");

-- CreateIndex
CREATE INDEX "orders_customer_phone_idx" ON "orders"("customer_phone");

-- CreateIndex
CREATE INDEX "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_checks_order_id_key" ON "fraud_checks"("order_id");

-- CreateIndex
CREATE INDEX "fraud_checks_status_idx" ON "fraud_checks"("status");

-- CreateIndex
CREATE INDEX "fraud_checks_risk_level_idx" ON "fraud_checks"("risk_level");

-- CreateIndex
CREATE INDEX "fraud_checks_scanned_at_idx" ON "fraud_checks"("scanned_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

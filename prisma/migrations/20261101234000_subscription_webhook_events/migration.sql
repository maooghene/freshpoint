CREATE TABLE "PaystackWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaystackWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaystackWebhookEvent_provider_eventKey_key"
ON "PaystackWebhookEvent"("provider", "eventKey");

CREATE INDEX "PaystackWebhookEvent_processedAt_idx"
ON "PaystackWebhookEvent"("processedAt");

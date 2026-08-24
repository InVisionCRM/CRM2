-- Activity phase 2: turn the activity log from a string log into an event log.
--
-- Today an edit records the sentence "Insurance information updated for lead
-- abc-123" - no field, no old value, no new value. Nothing downstream can
-- render "Claim # changed from 4417-B to 4418-B" because that data is not
-- stored. These three changes fix that.

-- 1. New event types. Contract lifecycle was never logged at all, and there was
--    no way to record that someone looked at a lead.
--    NOTE: only ADDs values here. Postgres forbids using a newly added enum
--    value in the same transaction that adds it, so nothing below references them.
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_SENT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_SIGNED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTRACT_DECLINED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LEAD_VIEWED';

-- 2. Structured payload: { verb, entity, actorName, changes: [{field, from, to}] }.
--    Nullable, so every existing row stays valid.
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 3. A client signing a contract is a real event with no CRM user behind it.
--    userId must therefore be allowed to be absent; metadata.actorName carries
--    who it was ("Marcus Webb", the homeowner).
ALTER TABLE "Activity" ALTER COLUMN "userId" DROP NOT NULL;

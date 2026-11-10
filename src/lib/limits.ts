// Keep in sync with enforce_car_limit() in supabase/migrations/0001_init.sql.
export const FREE_CAR_LIMIT = 5;
export const isActiveMembership = (status?: string | null) => status === "active" || status === "trialing";

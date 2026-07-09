/**
 * Get a personalized greeting based on a specific hour value
 * @param hour - The numerical hour (0-23) to evaluate
 * @returns A greeting string fragment
 */
export function getGreetingFragment(hour: number): string {
  if (hour >= 0 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}

/**
 * Server-Safe evaluation that processes time indicators based on an explicit IANA timezone string.
 * This allows Server Components to run greeting parameters safely via request context lookups.
 *
 * @param timezone - The standard IANA timezone code (e.g., "Africa/Lagos", "America/New_York")
 * @param firstName - The customer's optional first name
 * @returns A fully constructed localized greeting string
 */
export function getLocalizedServerGreeting(
  timezone: string,
  firstName?: string | null,
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });

    const hour = parseInt(formatter.format(new Date()), 10);
    const greetingFragment = getGreetingFragment(isNaN(hour) ? 12 : hour);
    const nameSegment = firstName ? `, ${firstName}` : "";

    return `${greetingFragment}${nameSegment}`;
  } catch (error: unknown) {
    console.warn(
      "Failed to parse localized timezone, falling back to neutral welcome statement:",
      error,
    );
    const fallbackName = firstName ? `, ${firstName}` : "";
    return `Welcome back${fallbackName}`;
  }
}

/**
 * Standard baseline evaluator that calculates raw server times.
 * WARNING: Do not bind the output of this function directly to shared UI layout trees
 * inside server components, as it will trigger hydration errors in multi-region environments.
 *
 * @param firstName - The user's optional first name shape tracking parameter
 */
export function getPersonalizedGreeting(firstName?: string | null): string {
  const serverHour = new Date().getHours();
  const timeGreeting = getGreetingFragment(serverHour);
  const nameSegment = firstName ? `, ${firstName}` : "";
  return `${timeGreeting}${nameSegment}`;
}

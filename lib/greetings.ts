/**
 * Get a personalized greeting based on the current time of day
 * @returns A greeting string (Good Morning, Good Afternoon, Good Evening)
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}

/**
 * Get a full personalized greeting with user's name
 * @param firstName - The user's first name
 * @returns A personalized greeting string
 */
export function getPersonalizedGreeting(firstName?: string | null): string {
  const timeGreeting = getTimeBasedGreeting();
  const name = firstName ? `, ${firstName}` : "";
  return `${timeGreeting}${name}`;
}

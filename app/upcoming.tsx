import { Redirect } from "expo-router";

/** Upcoming now lives as the Next tab. */
export default function UpcomingRedirect() {
  return <Redirect href="/(tabs)/next" />;
}

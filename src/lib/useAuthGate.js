import { useRouter } from "expo-router";
import { useAuth } from "../store/auth";
import { setPostLogin } from "./postLogin";

// Gate an action behind authentication. Guests are sent to the welcome screen
// with their intended destination remembered, so they land back on it after
// signing in. Authenticated users run the action straight away.
//
//   const gate = useAuthGate();
//   gate({ pathname: "/booking/new", params })   // navigate after login
//
// Returns true if the user was already signed in (action ran immediately).
export function useAuthGate() {
  const { user } = useAuth();
  const router = useRouter();

  return function gate(target) {
    if (user) {
      if (target) router.push(target);
      return true;
    }
    if (target) setPostLogin(target);
    router.push("/(auth)/welcome");
    return false;
  };
}

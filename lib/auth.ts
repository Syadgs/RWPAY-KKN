// Simple authentication functions
export async function signIn(email: string, password: string) {
  // For demo purposes, we'll use a simple check
  // In production, you'd want to use Supabase Auth or NextAuth.js

  if (email === "admin@rw08.com" && password === "admin123") {
    // Store session in localStorage for demo
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "rwpay_session",
        JSON.stringify({
          user: { email, name: "Administrator RW 08" },
          timestamp: Date.now(),
        }),
      )
    }
    return { success: true, user: { email, name: "Administrator RW 08" } }
  }

  throw new Error("Email atau password salah")
}

export async function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("rwpay_session")
  }
}

export function getCurrentUser() {
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("rwpay_session")
    if (session) {
      const parsed = JSON.parse(session)
      // Check if session is less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.user
      } else {
        localStorage.removeItem("rwpay_session")
      }
    }
  }
  return null
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}

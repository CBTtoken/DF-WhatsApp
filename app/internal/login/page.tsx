import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";

  const password = formData.get("password");
  if (password && password === process.env.INTERNAL_INBOX_PASSWORD) {
    (await cookies()).set("internal_auth", password.toString(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/internal");
  }

  redirect("/internal/login?error=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Internal Access</h1>
      <form action={login}>
        <input
          type="password"
          name="password"
          placeholder="Passcode"
          required
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
        <button type="submit" style={{ marginTop: 12, padding: "8px 16px" }}>
          Enter
        </button>
      </form>
      {error && <p style={{ color: "red" }}>Incorrect passcode.</p>}
    </main>
  );
}

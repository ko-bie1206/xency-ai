import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/post");

  const { error } = await searchParams;

  return (
    <div className="review-page">
      <div className="login-card">
        <div className="brand" style={{ justifyContent: "center", marginBottom: "1.6rem" }}>
          <BrandLogo />
        </div>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 700, textAlign: "center", marginBottom: "0.5rem" }}>
          スタッフログイン
        </h1>
        <p className="hint-text" style={{ textAlign: "center", marginBottom: "1.4rem" }}>
          許可されたGoogleアカウントでログインしてください。
        </p>
        {error && (
          <div className="error-text" style={{ textAlign: "center", marginBottom: "1rem" }}>
            このGoogleアカウントではログインできません。管理者に確認してください。
          </div>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/post" });
          }}
        >
          <button className="btn" type="submit" style={{ width: "100%", justifyContent: "center" }}>
            Googleでログイン
          </button>
        </form>
      </div>
    </div>
  );
}

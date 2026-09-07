import { avatarColor } from "@/lib/avatarColor";

export function ClientAvatar({
  name,
  avatarPath,
  size = 22,
  seed,
}: {
  name: string;
  avatarPath?: string | null;
  size?: number;
  seed?: string;
}) {
  if (avatarPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarPath}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      className="avatar-badge"
      style={{ width: size, height: size, fontSize: size * 0.33, background: avatarColor(seed ?? name) }}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

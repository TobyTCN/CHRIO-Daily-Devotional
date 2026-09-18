export default function Logo({ size = 40 }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      style={{ display: "block", borderRadius: "50%", flex: "none" }}
    />
  );
}
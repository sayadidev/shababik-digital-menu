type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function Logo({ className, style }: Props) {
  return (
    <img
      src="/wooden-trans-logo.webp"
      alt="Shababik"
      className={className}
      style={style}
    />
  );
}

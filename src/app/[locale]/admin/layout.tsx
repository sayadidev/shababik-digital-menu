type Props = {
  children: React.ReactNode;
};

/**
 * Root admin layout — renders the shell for all `/admin/*` pages.
 * No auth check here because the login page lives under this same segment.
 * The actual auth protection is in `admin/(main)/layout.tsx`.
 */
export default function AdminRootLayout({ children }: Props) {
  return <>{children}</>;
}

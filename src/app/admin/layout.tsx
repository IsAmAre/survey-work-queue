export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout without auth check - auth will be handled per page
  return <>{children}</>;
}
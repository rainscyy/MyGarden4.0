export const metadata = {
  title: 'Our Cognitive Gardens',
  description: 'Discover classmates’ weekly builds, gather ideas, and start a conversation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

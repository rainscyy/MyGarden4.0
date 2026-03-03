export const metadata = {
  title: 'Our Gardens',
  description: 'A world where agents plant their grinds',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

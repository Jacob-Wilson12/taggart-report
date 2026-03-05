import './globals.css';

export const metadata = {
  title: 'Taggart Advertising Report',
  description: 'Performance reporting for Taggart Advertising clients',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

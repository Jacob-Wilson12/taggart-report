import './globals.css';
export const metadata = {
  title: 'Taggart Advertising Report',
  description: 'Performance reporting for Taggart Advertising clients',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{fontFamily:"Inter, system-ui, sans-serif",fontWeight:600,margin:0,padding:0}}>{children}</body>
    </html>
  );
}

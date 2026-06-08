import './globals.css';
import AppChrome from '../components/AppChrome';
import DocumentMeta from '../components/DocumentMeta';
import { LanguageProvider } from '../providers/LanguageProvider';

export const metadata = {
  title: 'Seek Sophie CMS',
  description: 'AI-powered travel content editor',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <DocumentMeta />
          <AppChrome>{children}</AppChrome>
        </LanguageProvider>
      </body>
    </html>
  );
}

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Candidate Application Form',
  description: 'Professional candidate application and recruitment system',
  keywords: 'application, recruitment, job, career, candidate',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            // Default options
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '500px',
            },
            // Success styles
            success: {
              duration: 5000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                border: '1px solid #10b981',
              },
            },
            // Error styles
            error: {
              duration: 6000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                border: '1px solid #ef4444',
              },
            },
            // Loading styles
            loading: {
              iconTheme: {
                primary: '#8b5cf6',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, #5b21b6 0%, #6d28d9 100%)',
                border: '1px solid #8b5cf6',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

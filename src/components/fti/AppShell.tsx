import type { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { LanguageProvider } from '@/context/LanguageContext';

export const AppShell = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6 lg:py-10">{children}</main>
      <footer className="container py-8 text-center font-marker text-sm text-muted-foreground">
        Built with chaos, calculators & care · FTI
      </footer>
    </div>
  </LanguageProvider>
);

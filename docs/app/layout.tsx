import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'HiTechClaw — AI Agent Platform',
    template: '%s | HiTechClaw',
  },
  description:
    'Open-source AI Agent Platform with 10 LLM providers, 8 chat channels, visual workflows, and multi-tenant RBAC. Build AI agents in minutes.',
  keywords: [
    'AI Agent',
    'AI Platform',
    'LLM',
    'Workflow Builder',
    'TypeScript',
    'Open Source',
    'Multi-Agent',
    'HiTechClaw',
    'ChatBot',
    'Automation',
    'DeepSeek',
    'OpenRouter',
    'Slack',
    'WhatsApp',
    'Zalo',
  ],
  authors: [{ name: 'xDev.asia', url: 'https://hitechclaw.com' }],
  creator: 'Tran Duc Duy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hitechclaw.com',
    title: 'HiTechClaw — AI Agent Platform',
    description:
      'Open-source AI Agent Platform with 10 LLM providers, 8 chat channels, visual workflows.',
    siteName: 'HiTechClaw',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HiTechClaw — AI Agent Platform',
    description:
      'Open-source AI Agent Platform with 10 LLM providers, 8 chat channels, visual workflows.',
  },
  metadataBase: new URL('https://hitechclaw.com'),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body
        className="flex flex-col min-h-screen antialiased"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, var(--font-inter), "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}


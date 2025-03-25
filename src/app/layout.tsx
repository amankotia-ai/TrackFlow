import { UTMAnalyticsTracker } from '@/components/analytics/UTMAnalyticsTracker';

// Helper function to get Supabase project ID from env
function getSupabaseProjectId(): string {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    
    if (projectIdMatch && projectIdMatch[1]) {
      return projectIdMatch[1];
    }
    
    return 'missing-project-id';
  } catch (error) {
    console.error('Error getting Supabase project ID:', error);
    return 'error-getting-project-id';
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </ThemeProvider>
        <Analytics />
        <UTMAnalyticsTracker 
          projectId={getSupabaseProjectId()} 
          trackClicks={true}
          trackMouseMovement={true}
          sampleRate={0.05}
        />
      </body>
    </html>
  );
} 
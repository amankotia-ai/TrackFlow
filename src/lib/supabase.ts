import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  'https://zekigsebsmsukrummrzq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpla2lnc2Vic21zdWtydW1tcnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY0NzAyNjAsImV4cCI6MjAxMjA0NjI2MH0.iXanCY0tRjrq8rkHZMY_0J8WtH8nNq-tIrXKIXkJymw'
);

// Helper function to check and create bucket if it doesn't exist
export const ensureScriptBucket = async () => {
  try {
    // Check if the scripts bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return false;
    }
    
    const scriptsBucket = buckets.find(b => b.name === 'scripts');
    
    // If scripts bucket doesn't exist, create it
    if (!scriptsBucket) {
      const { error: createError } = await supabase.storage.createBucket('scripts', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
      });
      
      if (createError) {
        console.error('Error creating scripts bucket:', createError);
        return false;
      }
      
      console.log('Created scripts bucket successfully');
    }
    
    return true;
  } catch (err) {
    console.error('Error in ensureScriptBucket:', err);
    return false;
  }
}; 
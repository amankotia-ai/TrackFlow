# Setting Up Supabase Storage for UTM Content Magic

This guide explains how to properly set up the storage bucket needed for the UTM Content Magic script.

## 1. Create the Scripts Bucket

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (zekigsebsmsukrummrzq)
3. Navigate to `Storage` in the left sidebar
4. Click `New Bucket`
5. Enter the name `scripts` (exactly as shown, all lowercase)
6. Check the box for `Public bucket` to allow public read access
7. Click `Create bucket`

## 2. Set Up Storage Policies

Once the bucket is created, you need to set up appropriate policies:

1. Click on the newly created `scripts` bucket
2. Go to the `Policies` tab
3. Add the following policies:

### Public Read Access
- Click `New Policy`
- Name: `Allow public read access of scripts bucket`
- For operation: `SELECT` (read)
- Policy definition: `(bucket_id = 'scripts')`
- Apply to: `Everyone (including anonymous users)`
- Click `Save`

### Authenticated Upload Access
- Click `New Policy`
- Name: `Allow authenticated users to upload to scripts bucket`
- For operation: `INSERT` (create)
- Policy definition: `(bucket_id = 'scripts' AND auth.role() = 'authenticated')`
- Apply to: `Authenticated users only`
- Click `Save`

### Authenticated Update Access
- Click `New Policy`
- Name: `Allow authenticated users to update scripts bucket`
- For operation: `UPDATE`
- Policy definition: `(bucket_id = 'scripts' AND auth.role() = 'authenticated')`
- Apply to: `Authenticated users only`
- Click `Save`

### Authenticated Delete Access
- Click `New Policy`
- Name: `Allow authenticated users to delete from scripts bucket`
- For operation: `DELETE`
- Policy definition: `(bucket_id = 'scripts' AND auth.role() = 'authenticated')`
- Apply to: `Authenticated users only`
- Click `Save`

## 3. Testing Your Setup

After setting up the bucket and policies:

1. Make sure you're logged in to your application
2. Go to the Integration page
3. The storage error should no longer appear
4. Try uploading the script to verify everything works correctly

## Troubleshooting

If you still encounter issues:

1. **Storage bucket does not exist error**:
   - Double-check that you've created a bucket named exactly `scripts` (all lowercase)
   - Verify that your Supabase project ID matches the one in your application

2. **Permission denied error**:
   - Make sure you're logged in to your application
   - Check that the policies are correctly set up as described above
   - Ensure your user account has the proper roles assigned

3. **Still having issues?**:
   - Check the browser console for detailed error messages
   - Verify that your Supabase URL and keys are correct in your application
   - Make sure your Supabase project is on a plan that supports storage

Remember that service role keys should never be used in client-side code. All storage operations should be performed using the authenticated user's permissions or via secure backend functions. 
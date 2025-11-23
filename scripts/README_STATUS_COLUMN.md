# Status Column Setup Instructions

## Important: Kolom "Status" (uppercase) di database

Jika Anda mengalami error saat approve/reject join requests, pastikan:

1. **RPC Function sudah dibuat di Supabase:**
   - Buka Supabase Dashboard → SQL Editor
   - Jalankan script dari `scripts/create_update_status_function.sql`
   - Script ini membuat function `update_community_member_status` yang bisa handle kolom case-sensitive

2. **Refresh Schema Cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Verifikasi kolom Status ada:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'community_members' 
   AND column_name = 'Status';
   ```

## Troubleshooting

Jika masih error:
- Pastikan RPC function sudah dibuat
- Pastikan user memiliki permission untuk execute function
- Cek console browser untuk error message lengkap
- Pastikan kolom "Status" benar-benar ada di database (bukan "status" lowercase)






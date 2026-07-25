# Google Sheets backup service

1. Create a private Google Sheet owned by the designated Gmail account.
2. Open **Extensions → Apps Script** and paste `Code.gs`.
3. Add Script Properties:
   - `SPREADSHEET_ID`: ID from the Sheet URL.
   - `SHARED_SECRET`: the same random 32+ byte secret stored as `GOOGLE_APPS_SCRIPT_SECRET` in Vercel.
   - `RECONCILE_URL`: `https://<production-domain>/api/internal/reconcile`.
4. Run `setup()` once and approve the requested permissions.
5. Deploy as a Web App:
   - Execute as: **Me**
   - Access: **Anyone** (requests remain protected by timestamped HMAC signatures).
6. Put the deployment URL in Vercel as `GOOGLE_APPS_SCRIPT_URL`.
7. Keep the Sheet private, enable 2-Step Verification, and never log request payloads.

After deployment, run the disaster-recovery checklist in the root README before production use.

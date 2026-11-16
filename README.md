# THEE onset Enterprise — Version 3.0

A luxury-themed, mobile-first personal and multi-business finance command centre. It installs on Android as a Progressive Web App (PWA) through Chrome and can be hosted on GitHub Pages.

## Version 3.0 additions

- Device-level app lock using a 4–8 digit PIN hashed with SHA-256 in browser storage. This is a convenience lock, not banking-grade security or device encryption.
- Statement review workspace for CSV files exported from M-Pesa or bank portals. Imported rows are marked pending review; duplicate receipt/reference values are skipped.
- Financial health snapshot with cash-flow surplus and debt-to-recorded-assets indicators. It is not a credit score or financial advice.
- Audit trail for record creation, update, deletion, statement import, review, backup and cloud sync. Audit entries are included in backups and Google Sheets sync; the log is not tamper-proof.
- Print / Save as PDF for the financial reports page.
- Version 2 and Version 1 local browser data migration to the Version 3 store.
- Google Sheets backend now stores the audit log and uses a revision check to detect concurrent cloud edits before replacing the cloud snapshot.

## Publish with GitHub Pages

1. Extract the ZIP archive.
2. Create a GitHub repository, for example `thee-onset-enterprise`.
3. Upload the contents of this folder into the repository root (not the parent folder).
4. Open **Settings → Pages**.
5. Select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Wait for deployment. The address will look like `https://YOUR-USERNAME.github.io/thee-onset-enterprise/`.
7. Open the address in Chrome on Android and choose **Install app** or **Add to Home screen**.

This is an installable PWA, not a signed APK. A signed Android APK requires Android packaging and signing as a separate build step.

## Google Sheets backend setup

1. Create a blank Google Sheet named **THEE onset Enterprise Backend**.
2. Open **Extensions → Apps Script** and replace the editor contents with `Code.gs` from this package.
3. Replace `API_KEY` with a long unique random key. Do not commit a real key into a public GitHub repository.
4. Save and run `setup` once; approve the requested permissions. It creates Transactions, Accounts, Assets, Debts, Debt Repayments, Projects, Investments, Goals, Audit Log, Businesses, Settings, Sync Log and Monthly Reports tabs.
5. Choose **Deploy → New deployment → Web app**; execute as **Me** and select access that allows your own device to reach the endpoint. Deploy and authorize.
6. Copy the `/exec` URL. In the app, open **Settings & data**, paste the URL and same key, save, then choose **Sync now**.
7. The backend maintains a revision number. If another device has saved since your last load, it rejects the stale upload; reload the cloud copy and reconcile your local changes before retrying. This prevents silent overwrites but does not automatically merge records.

## CSV statement import

The importer expects a header row with a date/time column, a description/details/narration/transaction column, and either separate Paid In / Paid Out (or credit / debit) columns, or an Amount / Value column. Receipt/reference/transaction ID is optional. Exported CSV formats differ between providers; inspect the imported rows and correct account/entity allocation before relying on totals. It does not connect directly to Safaricom or a bank.

## M-Pesa / Safaricom integration

M-Pesa account recording and CSV statement import are included. Automatic live transaction retrieval is not enabled. That requires Safaricom Daraja developer credentials, an approved use case, callback/validation handling, and a secure server-side integration. Never put Daraja consumer secrets in browser JavaScript or a public GitHub repository.

## Security and recordkeeping notes

- The app PIN is a local convenience barrier. Anyone with access to browser developer tools or the device's browser profile may be able to access locally stored data. Use Android device security and protect the Google account.
- The sync key is entered into this browser's local storage for convenience. Keep the deployed Apps Script URL and key private; anyone obtaining both may access the sheet through the endpoint. For stronger production security, use a proper authenticated backend.
- Do not store bank passwords, M-Pesa PINs, CVVs, one-time codes or authentication secrets in this app.
- Local records live in browser storage on the device where they are entered. Sync to Google Sheets for a cloud copy. The cloud uses a whole-workspace snapshot; revision checking detects conflicts but does not merge simultaneous edits.
- Verify important totals against official statements. This is a personal financial recordkeeping tool, not a bank, certified accounting system or regulated financial advice service.

## Version 3.0 spreadsheet tabs

| Tab | Contents |
|---|---|
| Transactions | Income, expenses, transfers, savings and statement references |
| Accounts | M-Pesa, bank, cash and mobile wallets |
| Assets | Property, vehicles, equipment and other assets |
| Debts | Lender, balance, payment, due date and status |
| Debt Repayments | Repayment history and payment references |
| Projects | Budgets, spending, business allocation and status |
| Investments | Principal, current value and business allocation |
| Goals | Savings goals and spending budgets |
| Audit Log | Operational activity history |
| Businesses | Business/entity names |
| Settings | Non-secret backend settings |
| Sync Log | Cloud sync history and revision outcomes |
| Monthly Reports | Month/business income, expenses and net cash flow |

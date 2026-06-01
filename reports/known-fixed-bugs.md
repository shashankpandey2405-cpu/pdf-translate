# Known fixed bugs

Generated: 2026-05-18

- ToolPage hybrid upload now uses `useHybridToolWorkflow` (IDB session survives login)
- Modal cancel clears file session consistently
- Removed dead `setModeModalOpen` branch in SinglePdfToolShell
- Worker reliable queue (RPOPLPUSH) replaces destructive RPOP-only
- Callback-after-success no longer mislabels done jobs as failed
- Output R2 keys aligned to `enhanced/output/{userId}/{jobId}.ext`
- Home category chips scroll-spy active state
- Premium card hidden when tool has no cloud worker
- `finalizing` status phase for cloud download

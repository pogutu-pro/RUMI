# Deploying RumiaRent (Oracle server, rumiarent.com)

Merging to `main` is the release. Every 2 minutes the server's
`rumi-deploy.timer` runs `deploy.sh`, which:

1. fetches `main` with a **read-only** GitHub deploy key;
2. builds the new images while the current site keeps running (a failed
   build changes nothing);
3. backs up the database to `/opt/rumi/backups/` (kept 14 days);
4. starts the new version (the backend runs migrations as it starts);
5. runs `ledger_backfill --check`.

Watch it: `tail -f /var/log/rumi-deploy.log`
Deploy now: `/opt/rumi/deploy.sh --force` (as ubuntu)
Pause auto-deploys: `sudo systemctl stop rumi-deploy.timer`

## One-time server setup (already done on 2026-10-21)

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/rumi_deploy   # add the .pub as a read-only deploy key on GitHub
sudo install -o ubuntu -g ubuntu -m 644 /dev/null /var/log/rumi-deploy.log
sudo cp deploy/systemd/rumi-deploy.* /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now rumi-deploy.timer
```

There is no inbound webhook. The server pulls, so no port is opened and
there is no secret to leak.

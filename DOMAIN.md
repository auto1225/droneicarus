# Custom domain — droneicarus.com

You've bought `droneicarus.com`. Here's the one-time setup to point it at GitHub Pages and configure Supabase Auth to accept redirects on that domain.

---

## 1. DNS records at your domain registrar

Open the DNS control panel of the registrar you bought `droneicarus.com` from (GoDaddy, Namecheap, Cloudflare, Gabia, etc.) and add these records.

### Apex (`droneicarus.com`)

Add **4 A records** pointing to GitHub Pages IPv4 addresses:

| Type | Name | Value            | TTL |
|------|------|------------------|-----|
| A    | @    | 185.199.108.153  | 3600 |
| A    | @    | 185.199.109.153  | 3600 |
| A    | @    | 185.199.110.153  | 3600 |
| A    | @    | 185.199.111.153  | 3600 |

And 4 **AAAA records** (IPv6, optional but recommended):

| Type | Name | Value                    | TTL |
|------|------|--------------------------|-----|
| AAAA | @    | 2606:50c0:8000::153      | 3600 |
| AAAA | @    | 2606:50c0:8001::153      | 3600 |
| AAAA | @    | 2606:50c0:8002::153      | 3600 |
| AAAA | @    | 2606:50c0:8003::153      | 3600 |

### www subdomain (`www.droneicarus.com`)

One **CNAME** record:

| Type  | Name | Value                         | TTL |
|-------|------|-------------------------------|-----|
| CNAME | www  | auto1225.github.io.           | 3600 |

(Note the trailing dot — some panels add it automatically.)

### Verification: `dig`

After 5–60 minutes:

```bash
dig +short droneicarus.com           # → should list the 4 A records above
dig +short www.droneicarus.com       # → should list auto1225.github.io
```

---

## 2. GitHub Pages settings

1. Go to: **https://github.com/auto1225/droneicarus/settings/pages**
2. Under **Custom domain**, enter `droneicarus.com` → **Save**
3. GitHub will verify the DNS. Once it's green, tick **Enforce HTTPS** (usually appears after a few minutes when the cert is issued).

> `public/CNAME` in this repo already contains `droneicarus.com`, so Vite copies it into `dist/` on every build. GitHub Pages reads this file to confirm which custom domain is authoritative.

---

## 3. Supabase Auth — add the site URL

Redirects that arrive back from password-reset or magic-link emails must come from an allowlisted URL.

1. **https://supabase.com/dashboard/project/eotsbncgkgewgbemaarp/auth/url-configuration**
2. **Site URL**: `https://droneicarus.com`
3. **Redirect URLs** (add all of these):
   - `https://droneicarus.com`
   - `https://droneicarus.com/*`
   - `https://www.droneicarus.com`
   - `https://www.droneicarus.com/*`
   - `http://localhost:5173` (for local dev)
   - `http://localhost:5173/*`
4. Save.

Without these, `resetPasswordForEmail` / OAuth callbacks will bounce to `localhost` by default.

---

## 4. GitHub Actions secrets (reminder)

Set these in https://github.com/auto1225/droneicarus/settings/secrets/actions so Pages builds pick up your Supabase keys:

| Kind | Name                            | Value                                           |
|------|---------------------------------|-------------------------------------------------|
| Secret   | `VITE_SUPABASE_URL`         | `https://eotsbncgkgewgbemaarp.supabase.co`      |
| Secret   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (rotated!)                 |
| Variable | `VITE_USE_SUPABASE_DATA`    | `true` (after you've seeded data)               |

---

## 5. Smoke test

```bash
# 1. Push any commit to main → GitHub Actions rebuilds
# 2. Wait ~30s for the workflow to turn green
# 3. Visit: https://droneicarus.com
# 4. Click Sign in, register, see the app against real Supabase
```

If you get the raw `auto1225.github.io` page instead of `droneicarus.com`, the A records haven't propagated yet — give it 30 minutes and retry.

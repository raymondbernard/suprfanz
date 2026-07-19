import csv

# Read CSV
rows = []
fnames = []
with open('fbfriends.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fnames = [fn for fn in reader.fieldnames if fn and fn.strip()]
    for row in reader:
        clean = {fn: row.get(fn, '') for fn in fnames}
        rows.append(clean)

# Unmark contacts marked 'true' today (2026-07-18) — these were throttled by Facebook
fixed = 0
today = '2026-07-18'
for row in rows:
    sent_at = row.get('sent_at', '')
    if row.get('message_sent') == 'true' and today in sent_at:
        name = row.get('fb_name', '')
        pid = row.get('fb_profile_id', '')
        row['message_sent'] = 'false'
        row['sent_at'] = ''
        row['last_error'] = 'FB_THROTTLED: couldnt send'
        fixed += 1
        print(f'  UNMARKED: {name} ({pid})')

with open('fbfriends.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=fnames, extrasaction='ignore')
    w.writeheader()
    w.writerows(rows)

print(f'\nFixed {fixed} contacts that were throttled by Facebook')
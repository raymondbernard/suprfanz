import csv, json

ny_kw = ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens', 'bronx', 'staten island', 'astoria', 'harlem', 'long island', 'hoboken', 'jersey city', 'yonkers', 'white plains', ', ny']

# Load NY profiles
ny_profiles = set()
with open('contacts/fb_friend.csv', 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) < 5: continue
        loc = (row[3] if len(row) > 3 else '').lower()
        pid = (row[4] if len(row) > 4 else '').lstrip('/')
        if pid and any(k in loc for k in ny_kw):
            ny_profiles.add(pid)

print(f'NY profiles: {len(ny_profiles)}')

# Load history
history = {}
try:
    with open('message_history.json') as f: history = json.load(f)
except: pass

EVENT_URL = 'https://www.facebook.com/events/971902445574502'
contacts = []
with open('fbfriends.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('message_sent') in ('true', 'bad'): continue
        pid = row.get('fb_profile_id', '').lstrip('/')
        if not pid: continue
        if pid in history and any(h.get('event_url') == EVENT_URL for h in history.get(pid, [])): continue
        if pid not in ny_profiles: continue
        contacts.append({
            'name': row.get('fb_name', pid),
            'first': row.get('fb_first_name', ''),
            'pid': pid
        })

print(f'Pending NY contacts: {len(contacts)}')
print()

# Output as JS array
lines = ['const contacts = [']
for c in contacts[:100]:
    name = c['name'].replace("'", "\\'")
    first = c['first'].replace("'", "\\'")
    lines.append(f"    {{ name: '{name}', first: '{first}', url: 'https://www.messenger.com/t/{c['pid']}' }},")
lines.append('];')

with open('contacts_100.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Wrote {min(100, len(contacts))} contacts to contacts_100.js')
print()
print('First 10:')
for c in contacts[:10]:
    print(f"  {c['name']} — {c['pid']}")
import csv
import re

# Read the expanded CSV from PDF parse
festivals = []
with open('blues-festivals-2026-expanded.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        festivals.append(r)

# Add festivals found via web search that aren't already in the list
new_festivals = [
    {'name': 'Billtown Blues Audition', 'date': '2026', 'location': 'Pennsylvania, PA', 'website': 'https://www.billtownblues.org/2026-audition-concert-application', 'notes': 'PA-based blues musicians only'},
    {'name': 'Cincy Blues Challenge', 'date': 'Jun 14, 2026', 'location': 'Cincinnati, OH', 'website': 'https://cincyblues.org/2026/05/18/cincy-blues-challenge-call-for-entries-18/', 'notes': 'Emerging artists competition'},
    {'name': 'Westsylvania Jazz & Blues Festival', 'date': '2026', 'location': 'PA', 'website': 'https://westsylvaniajazzandblues.org/news/star-call', 'notes': 'Student musicians grades 8-12'},
    {'name': 'Wiregrass Blues Festival', 'date': 'Mar 21, 2026', 'location': 'Dothan, AL', 'website': 'https://www.wiregrassbluesfestival.com/2026---13th-annual', 'notes': '13th annual, Crystal Shawanda headlining'},
    {'name': 'San Rafael PorchFest', 'date': 'Sep 20, 2026', 'location': 'San Rafael, CA', 'website': 'https://www.sanrafaelporchfest.com/apply-to-perform', 'notes': 'Application open 3/15-6/15'},
    {'name': 'Blues at Bridgetown', 'date': '2026', 'location': 'Bridgetown, Australia', 'website': 'https://wam.org.au/2026/03/11/blues-at-bridgetown-2026-artist-applications-open/', 'notes': 'Artist applications OPEN'},
    {'name': 'Girrakool Blues Festival', 'date': 'Feb 27 - Mar 1, 2026', 'location': 'Central Coast, Australia', 'website': 'https://girrakoolblues.com.au/artist-applications/', 'notes': '8th annual, artist applications open'},
    {'name': 'Blues Aperitiv Competition', 'date': '2026', 'location': 'Czech Republic', 'website': 'https://www.bluesalive.cz/en/aperitiv-en/', 'notes': '27th edition, blues competition for new talents'},
    {'name': 'ABAS Blues Festival & Challenge', 'date': '2026', 'location': 'Greece', 'website': 'https://europeanbluesunion.com/abas-blues-festival-challenge-2026/', 'notes': '2nd edition, applications open'},
]

existing_names = set(f['festival'].lower() for f in festivals)
for nf in new_festivals:
    if nf['name'].lower() not in existing_names:
        festivals.append({
            'rank': len(festivals) + 1,
            'festival': nf['name'],
            'date': nf['date'],
            'venue': '',
            'location': nf['location'],
            'state': nf['location'].split(',')[-1].strip() if ',' in nf['location'] else '',
            'phone': '',
            'website': nf['website'],
            'status': '',
            'booking_contact': '',
            'email': '',
            'notes': nf['notes'],
        })

# Renumber
for i, f in enumerate(festivals, 1):
    f['rank'] = i

# Write merged CSV
fieldnames = ['rank', 'festival', 'date', 'venue', 'location', 'state', 'phone', 'website', 'status', 'booking_contact', 'email', 'notes']
with open('blues-festivals-2026-master.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for fest in festivals:
        writer.writerow({k: fest.get(k, '') for k in fieldnames})

print('Master festival list: %d festivals' % len(festivals))
print()

# Stats
from collections import Counter
states = Counter(f.get('state','') for f in festivals if f.get('state',''))
print('Top 15 states/countries:')
for s, c in states.most_common(15):
    print('  %s: %d' % (s, c))

has_web = sum(1 for f in festivals if f.get('website',''))
has_phone = sum(1 for f in festivals if f.get('phone',''))
print()
print('With websites: %d / %d' % (has_web, len(festivals)))
print('With phone: %d / %d' % (has_phone, len(festivals)))

# US only
us_states = {'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'}
us_fests = [f for f in festivals if f.get('state','') in us_states]
print()
print('US festivals: %d' % len(us_fests))

# Festivals with application-related websites
apply_keywords = ['apply', 'application', 'submit', 'performer', 'artist', 'booking', 'audition']
can_apply = [f for f in festivals if any(kw in (f.get('website','') + f.get('notes','')).lower() for kw in apply_keywords)]
print('Festivals with application/booking links: %d' % len(can_apply))
print()
print('Festivals with open/clear application URLs:')
for f in can_apply:
    if any(kw in (f.get('website','')).lower() for kw in ['apply', 'application', 'submit', 'performer', 'artist', 'booking', 'audition']):
        print('  %s -- %s' % (f['festival'][:50], f['website']))

# NY festivals
print()
print('NY festivals:')
for f in festivals:
    if f.get('state','') == 'NY':
        print('  %s | %s | %s' % (f['festival'][:45], f.get('date',''), f.get('website','')))
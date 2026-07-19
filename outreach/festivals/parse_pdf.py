import re
import csv

with open('living-blues-festival-guide-2026.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Parse the festival guide text into structured entries
# Format pattern: Festival Name\nDate(s)\nVenue\nCity, State\nPhone\nWebsite
# State headers are in ALL CAPS on their own line

festivals = []
current_state = ''
lines = text.split('\n')
i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Check if this is a state header (ALL CAPS, short line, no numbers)
    if line and line.isupper() and len(line) <= 30 and not any(c.isdigit() for c in line):
        current_state = line.title()
        # Fix common state name issues
        state_fixes = {
            'Arkansas': 'AR', 'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT',
            'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
            'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
            'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
            'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
            'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
            'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
            'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
            'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
            'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
            'District Of Columbia': 'DC',
        }
        state_code = state_fixes.get(current_state, current_state)
        i += 1
        continue
    
    # Skip page headers and empty lines
    if not line or 'Living Blues' in line or 'Compiled by' in line or line.startswith('Specific dates'):
        i += 1
        continue
    
    # Try to identify a festival entry — it starts with a name line
    # followed by a date line, then venue, then city/state
    if 'state_code' not in dir():
        state_code = ''
    
    if line and not line[0].isdigit() and not line.startswith('www.') and not line.startswith('http'):
        # Collect next several lines to form an entry
        entry_lines = [line]
        j = i + 1
        while j < min(i + 8, len(lines)):
            next_line = lines[j].strip()
            if not next_line:
                j += 1
                continue
            if next_line.isupper() and len(next_line) <= 30 and not any(c.isdigit() for c in next_line):
                break  # Next state header
            if 'Living Blues' in next_line:
                break
            entry_lines.append(next_line)
            j += 1
        
        # Parse entry: name, date, venue, city/state, phone, website
        name = entry_lines[0]
        date = ''
        venue = ''
        city_state = ''
        phone = ''
        website = ''
        location = ''
        
        for el in entry_lines[1:]:
            # Date pattern
            if re.match(r'^(TBA|Postponed|Cancelled|January|February|March|April|May|June|July|August|September|October|November|December|\d)', el) and not phone and not website:
                if not date:
                    date = el
                    continue
            # Phone pattern
            if re.match(r'^\d{3}[\.\-]?\d{3}[\.\-]?\d{4}$', el) or re.match(r'^\d{3}\.\d{3}\.\d{4}$', el):
                phone = el
                continue
            # Website pattern
            if el.startswith('www.') or el.startswith('http') or el.startswith('facebook.com'):
                website = el
                continue
            # City, State pattern
            if ',' in el and not venue:
                city_state = el
                continue
            # Venue or city line
            if not venue and not date:
                venue = el
            elif not city_state and ',' not in el and not el.startswith('www'):
                city_state = el
            elif not website and not phone:
                # Could be venue or location
                if not venue:
                    venue = el
                elif not city_state:
                    city_state = el
        
        # Clean up
        if city_state and ',' in city_state:
            parts = city_state.split(',')
            city = parts[0].strip()
            location = '%s, %s' % (city, state_code if 'state_code' in dir() else '')
        elif city_state:
            location = city_state
        else:
            location = state_code if 'state_code' in dir() else ''
        
        # Skip page headers and non-festival entries
        if name in ['Living Blues Festival Guide', 'Compiled by Melanie Young'] or len(name) < 5:
            i = j
            continue
        
        festivals.append({
            'name': name,
            'date': date,
            'venue': venue,
            'location': location,
            'state': state_code,
            'phone': phone,
            'website': website,
        })
        
        i = j
        continue
    
    i += 1

# Remove duplicates
seen = set()
unique = []
for f in festivals:
    key = f['name'].lower()
    if key not in seen:
        seen.add(key)
        unique.append(f)

print('Parsed %d unique festivals from Living Blues Guide' % len(unique))
print()

# Count by state
from collections import Counter
state_counts = Counter(f['state'] for f in unique)
print('By state:')
for s, c in state_counts.most_common():
    print('  %s: %d' % (s, c))

# Write CSV
fieldnames = ['rank', 'festival', 'date', 'venue', 'location', 'state', 'phone', 'website', 'status', 'booking_contact', 'email', 'notes']
with open('blues-festivals-2026-expanded.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for i, fest in enumerate(unique, 1):
        writer.writerow({
            'rank': i,
            'festival': fest['name'],
            'date': fest['date'],
            'venue': fest['venue'],
            'location': fest['location'],
            'state': fest['state'],
            'phone': fest['phone'],
            'website': fest['website'],
            'status': '',
            'booking_contact': '',
            'email': '',
            'notes': 'From Living Blues Festival Guide 2026',
        })

print()
print('Written to blues-festivals-2026-expanded.csv')

# Show NY festivals
print()
print('NY festivals:')
for f in unique:
    if f['state'] == 'NY':
        print('  %s | %s | %s | %s' % (f['name'][:45], f['date'], f['location'], f['website']))

# Show festivals with websites
print()
with_web = [f for f in unique if f['website']]
print('Festivals with websites: %d / %d' % (len(with_web), len(unique)))
print('Festivals with phone: %d / %d' % (sum(1 for f in unique if f['phone']), len(unique)))
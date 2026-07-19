import csv
import re

with open('blues-festivals-2026-master.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

# Read the raw text to re-parse with better state detection
with open('living-blues-festival-guide-2026.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# The issue is the state headers weren't always detected. Let's use a more robust approach:
# State headers appear as ALL CAPS lines. Let's find all of them with their line numbers.
lines = text.split('\n')

# Map state names to codes
state_map = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT',
    'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI',
    'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
    'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME',
    'MARYLAND': 'MD', 'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS', 'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE',
    'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM',
    'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
    'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX',
    'UTAH': 'UT', 'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
    # International
    'CANADA': 'Canada', 'AUSTRALIA': 'Australia', 'NEW ZEALAND': 'New Zealand',
    'MEXICO': 'Mexico', 'CARIBBEAN': 'Caribbean', 'SOUTH AMERICA': 'South America',
    'SOUTH ASIA': 'South Asia', 'EAST ASIA': 'East Asia', 'CENTRAL AMERICA': 'Central America',
    'CRUISES': 'Cruises',
}

# Find state header line numbers
state_at_line = {}
for i, line in enumerate(lines):
    stripped = line.strip()
    # State headers: ALL CAPS, no digits, reasonable length, in our map
    if stripped and stripped.isupper() and len(stripped) <= 30 and not any(c.isdigit() for c in stripped):
        if stripped in state_map:
            state_at_line[i] = state_map[stripped]
        # Try without common suffixes
        elif stripped.replace(' ', '') in [s.replace(' ', '') for s in state_map]:
            for s in state_map:
                if stripped.replace(' ', '') == s.replace(' ', ''):
                    state_at_line[i] = state_map[s]
                    break

# Build a line-to-state mapping
line_states = [None] * len(lines)
current_state = None
for i in range(len(lines)):
    if i in state_at_line:
        current_state = state_at_line[i]
    line_states[i] = current_state

# Now re-parse the festivals with correct state info
festivals = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    state = line_states[i]
    
    # Skip empty, page headers, state headers, and meta lines
    if not line or 'Living Blues' in line or 'Compiled by' in line or line.startswith('Specific dates'):
        i += 1
        continue
    if line in state_map or (line.isupper() and len(line) <= 30 and not any(c.isdigit() for c in line)):
        i += 1
        continue
    
    # Festival entry starts with a non-digit, non-URL line
    if line and not line[0].isdigit() and not line.startswith('www.') and not line.startswith('http'):
        entry_lines = [line]
        j = i + 1
        while j < min(i + 10, len(lines)):
            nl = lines[j].strip()
            if not nl:
                j += 1
                continue
            if nl.isupper() and len(nl) <= 30 and not any(c.isdigit() for c in nl) and nl in state_map:
                break
            if 'Living Blues' in nl:
                break
            entry_lines.append(nl)
            j += 1
        
        # Parse entry
        name = entry_lines[0]
        date = ''
        venue = ''
        city = ''
        phone = ''
        website = ''
        
        for el in entry_lines[1:]:
            if re.match(r'^\d{3}[\.\-]?\d{3}[\.\-]?\d{4}$', el) or re.match(r'^\d{3}\.\d{3}\.\d{4}$', el):
                phone = el
            elif el.startswith('www.') or el.startswith('http') or el.startswith('facebook.com'):
                if not website:
                    website = el
            elif not date and (re.match(r'^(TBA|Postponed|Cancelled|January|February|March|April|May|June|July|August|September|October|November|December)', el) or re.match(r'^\d', el)):
                date = el
            elif not venue and ',' not in el and not el.startswith('www') and not re.match(r'^\d{3}', el):
                venue = el
            elif not city and ',' not in el and not el.startswith('www') and not re.match(r'^\d{3}', el) and el != venue:
                city = el
            elif ',' in el and not el.startswith('www'):
                if not city:
                    city = el
        
        # Build location
        if city and ',' in city:
            city_name = city.split(',')[0].strip()
        else:
            city_name = city
        
        # Skip non-festival entries
        if len(name) < 5 or name in ['Living Blues Festival Guide', 'Compiled by Melanie Young']:
            i = j
            continue
        
        festivals.append({
            'name': name,
            'date': date,
            'venue': venue,
            'city': city_name,
            'state': state or '',
            'phone': phone,
            'website': website,
        })
        i = j
        continue
    
    i += 1

# Remove duplicates by name
seen = set()
unique = []
for f in festivals:
    key = f['name'].lower().strip()
    if key not in seen and len(key) > 4:
        seen.add(key)
        unique.append(f)

# Merge with web-searched festivals
web_fests = [
    {'name': 'Big Blues Bender', 'date': 'Sep 2026', 'city': 'Reno', 'state': 'NV', 'phone': '', 'website': 'https://bigbluesbender.com/', 'venue': ''},
    {'name': 'Crescent City Blues & BBQ Festival', 'date': 'Oct 9-11, 2026', 'city': 'New Orleans', 'state': 'LA', 'phone': '', 'website': 'https://www.jazzandheritage.org/events/2026-crescent-city-blues-bbq-festival/', 'venue': ''},
    {'name': 'Big Bull Falls Blues Fest', 'date': 'Aug 21-22, 2026', 'city': 'Wausau', 'state': 'WI', 'phone': '', 'website': 'https://wausauevents.org/big-bull-falls-blues-fest', 'venue': ''},
    {'name': 'Upton Blues Festival', 'date': '2026', 'city': 'Upton', 'state': 'UK', 'phone': '', 'website': 'https://uptonbluesfestival.com/bandbookings2026/', 'venue': ''},
    {'name': 'BlackAmericana Fest', 'date': '2026', 'city': '', 'state': '', 'phone': '', 'website': 'https://www.blackamericanafest.com/musical-artist-submission', 'venue': ''},
    {'name': 'OZONE Songwriter Festival', 'date': '2026', 'city': '', 'state': 'LA', 'phone': '', 'website': 'https://ozonemusic.org/2026-ozone-music-festival-performer-application/', 'venue': ''},
    {'name': 'Atlanta Blues Challenge', 'date': 'Aug 16, 2026', 'city': 'Woodstock', 'state': 'GA', 'phone': '', 'website': 'https://atlantabluessociety.org/2026/05/blues-challenge-now-taking-applications/', 'venue': 'Madlife Stage & Studios'},
    {'name': 'Billtown Blues Audition', 'date': '2026', 'city': '', 'state': 'PA', 'phone': '', 'website': 'https://www.billtownblues.org/2026-audition-concert-application', 'venue': ''},
    {'name': 'Cincy Blues Challenge', 'date': 'Jun 14, 2026', 'city': 'Cincinnati', 'state': 'OH', 'phone': '', 'website': 'https://cincyblues.org/2026/05/18/cincy-blues-challenge-call-for-entries-18/', 'venue': ''},
    {'name': 'Westsylvania Jazz & Blues Festival', 'date': '2026', 'city': '', 'state': 'PA', 'phone': '', 'website': 'https://westsylvaniajazzandblues.org/news/star-call', 'venue': ''},
    {'name': 'Wiregrass Blues Festival', 'date': 'Mar 21, 2026', 'city': 'Dothan', 'state': 'AL', 'phone': '', 'website': 'https://www.wiregrassbluesfestival.com/2026---13th-annual', 'venue': 'The Plant'},
    {'name': 'San Rafael PorchFest', 'date': 'Sep 20, 2026', 'city': 'San Rafael', 'state': 'CA', 'phone': '', 'website': 'https://www.sanrafaelporchfest.com/apply-to-perform', 'venue': ''},
    {'name': 'Blues at Bridgetown', 'date': '2026', 'city': 'Bridgetown', 'state': 'Australia', 'phone': '', 'website': 'https://wam.org.au/2026/03/11/blues-at-bridgetown-2026-artist-applications-open/', 'venue': ''},
    {'name': 'Girrakool Blues Festival', 'date': 'Feb 27 - Mar 1, 2026', 'city': 'Central Coast', 'state': 'Australia', 'phone': '', 'website': 'https://girrakoolblues.com.au/artist-applications/', 'venue': ''},
    {'name': 'Blues Aperitiv Competition', 'date': '2026', 'city': '', 'state': 'Czech Republic', 'phone': '', 'website': 'https://www.bluesalive.cz/en/aperitiv-en/', 'venue': ''},
    {'name': 'ABAS Blues Festival & Challenge', 'date': '2026', 'city': '', 'state': 'Greece', 'phone': '', 'website': 'https://europeanbluesunion.com/abas-blues-festival-challenge-2026/', 'venue': ''},
    {'name': 'Grassroots Finger Lakes Festival', 'date': 'Jul 16-19, 2026', 'city': 'Trumansburg', 'state': 'NY', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/grassroots-finger-lakes-festival-2026', 'venue': ''},
    {'name': 'Great South Bay Music Festival', 'date': 'Jul 23-26, 2026', 'city': 'Patchogue', 'state': 'NY', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/great-south-bay-music-festival-2026', 'venue': ''},
    {'name': 'Flood City Festival', 'date': 'Jul 24-25, 2026', 'city': 'Johnstown', 'state': 'PA', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/flood-city-festival-2026', 'venue': ''},
    {'name': 'Musikfest', 'date': 'Jul 31 - Aug 9, 2026', 'city': 'Bethlehem', 'state': 'PA', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/musikfest-2026', 'venue': ''},
    {'name': 'Beanstalk Music Festival', 'date': 'Aug 6-8, 2026', 'city': 'Bond', 'state': 'CO', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/beanstalk-music-festival-2026', 'venue': ''},
    {'name': 'Mile of Music', 'date': 'Jul 30 - Aug 2, 2026', 'city': 'Appleton', 'state': 'WI', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/mile-of-music-2026', 'venue': ''},
    {'name': 'Pickathon', 'date': 'Jul 30 - Aug 2, 2026', 'city': 'Happy Valley', 'state': 'OR', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/pickathon-2026', 'venue': ''},
    {'name': 'Newport Folk Festival', 'date': 'Jul 24-26, 2026', 'city': 'Newport', 'state': 'RI', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/newport-folk-festival-2026', 'venue': ''},
    {'name': 'Floydfest', 'date': 'Jul 22-26, 2026', 'city': 'Floyd', 'state': 'VA', 'phone': '', 'website': 'https://www.frontstagefestivals.com/festival/floydfest-2026', 'venue': ''},
    {'name': 'Rochester Jazz Festival', 'date': 'Summer 2026', 'city': 'Rochester', 'state': 'NY', 'phone': '', 'website': 'https://festt.io/en/festivals/rochester-jazz-festival-2026-2026', 'venue': ''},
]

existing_names = set(f['name'].lower() for f in unique)
for wf in web_fests:
    if wf['name'].lower() not in existing_names:
        unique.append(wf)
        existing_names.add(wf['name'].lower())

# Sort by state, then name
us_states_set = {'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'}
us = [f for f in unique if f['state'] in us_states_set]
intl = [f for f in unique if f['state'] and f['state'] not in us_states_set]
no_state = [f for f in unique if not f['state']]

us.sort(key=lambda x: (x['state'], x.get('name','')))
no_state.sort(key=lambda x: x.get('name',''))
intl.sort(key=lambda x: (x['state'], x.get('name','')))

# Write final master CSV
fieldnames = ['rank', 'festival', 'date', 'venue', 'city', 'state', 'phone', 'website', 'status', 'booking_contact', 'email', 'notes']
all_sorted = us + intl + no_state
with open('blues-festivals-2026-final.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for i, fest in enumerate(all_sorted, 1):
        writer.writerow({
            'rank': i,
            'festival': fest['name'],
            'date': fest.get('date', ''),
            'venue': fest.get('venue', ''),
            'city': fest.get('city', ''),
            'state': fest.get('state', ''),
            'phone': fest.get('phone', ''),
            'website': fest.get('website', ''),
            'status': '',
            'booking_contact': '',
            'email': '',
            'notes': 'From Living Blues Festival Guide 2026' if fest not in web_fests else 'Found via web search',
        })

print('Final master list: %d festivals' % len(all_sorted))
print('US: %d | International: %d | No state: %d' % (len(us), len(intl), len(no_state)))
print()

# Stats
has_web = sum(1 for f in all_sorted if f.get('website',''))
has_phone = sum(1 for f in all_sorted if f.get('phone',''))
print('With websites: %d / %d' % (has_web, len(all_sorted)))
print('With phone: %d / %d' % (has_phone, len(all_sorted)))
print()

from collections import Counter
print('US festivals by state:')
for s, c in Counter(f['state'] for f in us).most_common():
    print('  %s: %d' % (s, c))
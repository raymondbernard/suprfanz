import csv

# Contacts from subagent research + my own finds
contacts = {
    'Billtown Blues Audition': {'email': 'kendall.palmatier@gmail.com', 'booking_url': 'https://www.billtownblues.org/2026-audition-concert-application', 'contact_name': 'Kendall Palmatier', 'phone': '', 'notes': 'PA-based blues musicians only. Email subject must say "BBA Audition Application"'},
    'BlackAmericana Fest': {'email': '', 'booking_url': 'https://docs.google.com/forms/d/e/1FAIpQLSfLImmeYEaJWdezSX6QCunRMZ432io1ZKjVvTlJhqr6sbkwsQ/viewform', 'contact_name': '', 'phone': '', 'notes': 'Artist submission via Google Form. No direct email.'},
    'San Rafael PorchFest': {'email': '', 'booking_url': 'https://www.sanrafaelporchfest.com/apply-to-perform', 'contact_name': '', 'phone': '', 'notes': 'Application via web form on Wix site'},
    'OZONE Songwriter Festival': {'email': '', 'booking_url': 'https://ozonemusic.org/2026-ozone-music-festival-performer-application/', 'contact_name': '', 'phone': '', 'notes': 'Application via web form. Contact via ozonemusic.org/contact'},
    'Atlanta Blues Challenge': {'email': 'theatlantabluessociety@gmail.com', 'booking_url': 'https://atlantabluessociety.org/2026/05/blues-challenge-now-taking-applications/', 'contact_name': '', 'phone': '', 'notes': 'Atlanta Blues Society. Application PDF available for download.'},
    'Cincy Blues Challenge': {'email': '', 'booking_url': 'https://cincyblues.org/challenge/', 'contact_name': '', 'phone': '(513) 739-2583', 'notes': 'Contact via form at cincyblues.org/contact'},
    'Wiregrass Blues Festival': {'email': 'wiregrassblues@gmail.com', 'booking_url': 'https://www.wiregrassbluesfestival.com/2026---13th-annual', 'contact_name': '', 'phone': '334-648-6542', 'notes': 'Wiregrass Blues Society. PO Box 6185, Dothan, AL 36302'},
    'Westsylvania Jazz & Blues Festival': {'email': 'indianaartscouncil@gmail.com', 'booking_url': 'https://westsylvaniajazzandblues.org/news/star-call', 'contact_name': '', 'phone': '', 'notes': 'Organized by Indiana Arts Council. Star Call is for student musicians.'},
    'North Atlantic Blues Festival': {'email': 'benjaminproductions1953@gmail.com', 'booking_url': 'https://www.northatlanticbluesfestival.com/info/', 'contact_name': 'Paul Benjamin / Jamie Isaacson', 'phone': '207-691-0825', 'notes': 'Produced by Benjamin Productions. Rockland, ME.'},
    'Utah Blues Festival': {'email': 'UBFProducer@gmail.com', 'booking_url': 'https://www.utahbluesfest.org', 'contact_name': '', 'phone': '', 'notes': 'Also UBFVENDORS@gmail.com for vendor inquiries'},
    'Big Blues Bender': {'email': '', 'booking_url': 'https://bigbluesbender.com/', 'contact_name': '', 'phone': '', 'notes': 'No public email. Uses help portal. Curated festival, 2026 sold out.'},
    'Crescent City Blues & BBQ Festival': {'email': '', 'booking_url': 'https://www.jazzandheritage.org/contact/', 'contact_name': '', 'phone': '(504) 558-6100', 'notes': 'Organized by New Orleans Jazz & Heritage Foundation. Contact via web form. Appears curated.'},
    'Blue Note Jazz Festival NYC': {'email': 'club@bluenote.net', 'booking_url': 'https://www.bluenotejazz.com/jazz-festival-nyc/contact/', 'contact_name': '', 'phone': '(212) 475-8592', 'notes': 'Also boxoffice@sonyhall.com / (212) 997-5123'},
    'Grassroots Finger Lakes Festival': {'email': 'info@grassrootsfest.org', 'booking_url': 'https://www.grassrootsfest.org/contact', 'contact_name': '', 'phone': '(607) 387-5098', 'notes': 'Also tickets@grassrootsfest.org, promo@grassrootsfest.org'},
    'Great South Bay Music Festival': {'email': 'Jfaith@JFaith.com', 'booking_url': 'https://greatsouthbaymusicfestival.com/artist-submission/', 'contact_name': 'Ryan Adams (booking) / Jim Faith', 'phone': '631-331-0808', 'notes': 'Artist submissions: forward EPK to Ryan Adams with "GSB Artist Submission" in subject. Sponsorship: Jamie@JFaith.com / 631-946-2135'},
    'Rochester Jazz Festival': {'email': 'info@rochesterjazz.com', 'booking_url': 'https://rochesterjazz.com/contact/', 'contact_name': '', 'phone': '(585) 454-2060', 'notes': 'Artist/Manager submissions section on contact page (currently closed)'},
    'Musikfest': {'email': 'programming@artsquest.org', 'booking_url': 'https://www.artsquest.org/performing-arts/apply-to-perform/', 'contact_name': '', 'phone': '(610) 332-1300', 'notes': 'Operated by ArtsQuest. General info: info@artsquest.org'},
    'Newport Folk Festival': {'email': '', 'booking_url': 'https://newportfolk.org/contact', 'contact_name': '', 'phone': '', 'notes': 'Contact form with "Artist Submissions" dropdown option'},
    'Floydfest': {'email': 'performer@atwproductions.com', 'booking_url': 'https://floydfest.com/contact-us/booking/', 'contact_name': '', 'phone': '', 'notes': 'Artist submissions via email with promotional assets'},
    'Mile of Music': {'email': 'info@mileofmusic.com', 'booking_url': 'https://mileofmusic.com/contact-us/', 'contact_name': '', 'phone': '', 'notes': 'Artist submissions page: mileofmusic.com/festival-artists/artist-submissions/ (currently closed for 2026)'},
    'Pickathon': {'email': 'info@pickathon.com', 'booking_url': 'https://pickathon.com/info/contact-pickathon/', 'contact_name': '', 'phone': '', 'notes': 'Press: press@pickathon.com. Volunteer: volunteer@pickathon.com'},
    'Beanstalk Music Festival': {'email': 'BeanstalkFestival@gmail.com', 'booking_url': 'https://beanstalkfestival.com/contact-us.html', 'contact_name': '', 'phone': '', 'notes': 'Colorado-based festival'},
    'Big Bull Falls Blues Fest': {'email': 'brooklyn@wausauevents.org', 'booking_url': 'https://wausauevents.org/big-bull-falls-blues-fest', 'contact_name': 'Brooklyn Hess (Exec Director)', 'phone': '', 'notes': 'Sponsorship contact: brooklyn@wausauevents.org. Volunteer: volunteer@wausauevents.org. Appears curated.'},
}

# Read the final CSV
with open('blues-festivals-2026-final.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

# Merge contacts
updated = 0
for row in rows:
    name = row['festival']
    if name in contacts:
        c = contacts[name]
        if c['email']:
            row['email'] = c['email']
        if c['booking_url']:
            row['booking_contact'] = c['booking_url']
        if c['contact_name']:
            row['notes'] = c['notes']
        if c['phone']:
            row['phone'] = c['phone']
        if c['notes']:
            row['notes'] = c['notes']
        updated += 1

# Write updated CSV
with open('blues-festivals-2026-final.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

print('Updated %d festivals with contact info' % updated)
print()

# Show festivals with emails
with_email = [r for r in rows if r.get('email','')]
print('Festivals with email (%d):' % len(with_email))
for r in with_email:
    print('  %s -- %s' % (r['festival'][:45], r['email']))

print()
# Show festivals with booking URLs but no email
with_url_no_email = [r for r in rows if r.get('booking_contact','') and not r.get('email','')]
print('Festivals with booking URL but no email (%d):' % len(with_url_no_email))
for r in with_url_no_email:
    print('  %s -- %s' % (r['festival'][:45], r['booking_contact']))

print()
with_phone = [r for r in rows if r.get('phone','')]
print('Festivals with phone (%d):' % len(with_phone))
for r in with_phone:
    print('  %s -- %s' % (r['festival'][:45], r['phone']))
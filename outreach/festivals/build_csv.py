import csv

festivals = [
    {'rank':1, 'festival':'Big Blues Bender', 'location':'Reno, NV', 'state':'NV', 'dates':'Sep 2026', 'website':'https://bigbluesbender.com/', 'status':'', 'booking_contact':'', 'email':'', 'notes':'45 artists, one of largest US blues fests'},
    {'rank':2, 'festival':'Crescent City Blues & BBQ Festival', 'location':'New Orleans, LA', 'state':'LA', 'dates':'Oct 9-11, 2026', 'website':'https://www.jazzandheritage.org/events/2026-crescent-city-blues-bbq-festival/', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Free admission, Jazz & Heritage Foundation'},
    {'rank':3, 'festival':'Heritage Music Bluesfest', 'location':'WV', 'state':'WV', 'dates':'Aug 7-9, 2026', 'website':'https://www.eventeny.com/events/vendor/?id=48233', 'status':'Deadline passed (Jun 16)', 'booking_contact':'', 'email':'', 'notes':'Artist app via Eventeny'},
    {'rank':4, 'festival':'Midway Bourbon & Blues Festival', 'location':'Midway, KY', 'state':'KY', 'dates':'2026', 'website':'https://www.eventeny.com/events/vendor/?id=41236', 'status':'Deadline passed (May 13)', 'booking_contact':'', 'email':'', 'notes':'Artist app via Eventeny'},
    {'rank':5, 'festival':'Highland Jazz & Blues Festival', 'location':'Highland, IN', 'state':'IN', 'dates':'Aug 2026', 'website':'https://www.eventeny.com/events/applications/application/?id=7307', 'status':'Deadline passed (Apr 18)', 'booking_contact':'', 'email':'', 'notes':'22nd annual, musician app via Eventeny'},
    {'rank':6, 'festival':'Big Bull Falls Blues Fest', 'location':'Wausau, WI', 'state':'WI', 'dates':'Aug 21-22, 2026', 'website':'https://wausauevents.org/big-bull-falls-blues-fest', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Wisconsin longest running blues festival'},
    {'rank':7, 'festival':'Upton Blues Festival', 'location':'Upton, UK', 'state':'UK', 'dates':'2026', 'website':'https://uptonbluesfestival.com/bandbookings2026/', 'status':'Open', 'booking_contact':'', 'email':'', 'notes':'UK festival, accepting band bookings for 2026'},
    {'rank':8, 'festival':'BlackAmericana Fest', 'location':'United States', 'state':'', 'dates':'2026', 'website':'https://www.blackamericanafest.com/musical-artist-submission', 'status':'Open', 'booking_contact':'', 'email':'', 'notes':'Accepting artist submissions for 2026'},
    {'rank':9, 'festival':'OZONE Songwriter Festival', 'location':'Louisiana', 'state':'LA', 'dates':'2026', 'website':'https://ozonemusic.org/2026-ozone-music-festival-performer-application/', 'status':'Open', 'booking_contact':'', 'email':'', 'notes':'Performer application open'},
    {'rank':10, 'festival':'Atlanta Blues Challenge', 'location':'Woodstock, GA', 'state':'GA', 'dates':'Aug 16, 2026', 'website':'https://atlantabluessociety.org/2026/05/blues-challenge-now-taking-applications/', 'status':'Open (deadline Jul 19)', 'booking_contact':'', 'email':'', 'notes':'Atlanta Blues Society competition'},
    {'rank':11, 'festival':'Grassroots Finger Lakes Festival', 'location':'Trumansburg, NY', 'state':'NY', 'dates':'Jul 16-19, 2026', 'website':'https://www.frontstagefestivals.com/festival/grassroots-finger-lakes-festival-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Multi-genre incl blues'},
    {'rank':12, 'festival':'Great South Bay Music Festival', 'location':'Patchogue, NY', 'state':'NY', 'dates':'Jul 23-26, 2026', 'website':'https://www.frontstagefestivals.com/festival/great-south-bay-music-festival-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Multi-genre, Long Island NY'},
    {'rank':13, 'festival':'Flood City Festival', 'location':'Johnstown, PA', 'state':'PA', 'dates':'Jul 24-25, 2026', 'website':'https://www.frontstagefestivals.com/festival/flood-city-festival-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':''},
    {'rank':14, 'festival':'Musikfest', 'location':'Bethlehem, PA', 'state':'PA', 'dates':'Jul 31 - Aug 9, 2026', 'website':'https://www.frontstagefestivals.com/festival/musikfest-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Large multi-genre festival'},
    {'rank':15, 'festival':'Beanstalk Music Festival', 'location':'Bond, CO', 'state':'CO', 'dates':'Aug 6-8, 2026', 'website':'https://www.frontstagefestivals.com/festival/beanstalk-music-festival-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Blues genre tagged'},
    {'rank':16, 'festival':'Mile of Music', 'location':'Appleton, WI', 'state':'WI', 'dates':'Jul 30 - Aug 2, 2026', 'website':'https://www.frontstagefestivals.com/festival/mile-of-music-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':''},
    {'rank':17, 'festival':'Pickathon', 'location':'Happy Valley, OR', 'state':'OR', 'dates':'Jul 30 - Aug 2, 2026', 'website':'https://www.frontstagefestivals.com/festival/pickathon-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':''},
    {'rank':18, 'festival':'Newport Folk Festival', 'location':'Newport, RI', 'state':'RI', 'dates':'Jul 24-26, 2026', 'website':'https://www.frontstagefestivals.com/festival/newport-folk-festival-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'Prestigious, multi-genre'},
    {'rank':19, 'festival':'Floydfest', 'location':'Floyd, VA', 'state':'VA', 'dates':'Jul 22-26, 2026', 'website':'https://www.frontstagefestivals.com/festival/floydfest-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':''},
    {'rank':20, 'festival':'Rochester Jazz Festival', 'location':'Rochester, NY', 'state':'NY', 'dates':'Summer 2026', 'website':'https://festt.io/en/festivals/rochester-jazz-festival-2026-2026', 'status':'', 'booking_contact':'', 'email':'', 'notes':'146 artists, jazz & blues'},
]

fieldnames = ['rank','festival','location','state','dates','website','status','booking_contact','email','notes']
with open('blues-festivals-2026.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in festivals:
        writer.writerow(r)

print('Written %d festivals to blues-festivals-2026.csv' % len(festivals))
print()
print('Festivals with OPEN applications:')
for f in festivals:
    if 'open' in f['status'].lower():
        print('  %s -- %s' % (f['festival'], f['website']))
print()
print('Festivals in NY:')
for f in festivals:
    if f['state'] == 'NY':
        print('  %s -- %s -- %s' % (f['festival'], f['dates'], f['website']))
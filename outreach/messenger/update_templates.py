import re

with open('messenger_terminal.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the templates block
# The templates start with 'templates = {' and end with the closing '}'
# after the last style "favor"

old_start = content.find('templates = {')
favor_idx = content.find('"favor"', old_start)
if old_start < 0 or favor_idx < 0:
    print('ERROR: Could not find templates block')
    exit(1)

# Find the closing of favor array and then the templates dict
# After "favor": [...] comes }
bracket_count = 0
i = favor_idx
while i < len(content):
    if content[i] == '[':
        bracket_count += 1
    elif content[i] == ']':
        bracket_count -= 1
        if bracket_count == 0:
            break
    i += 1

# Find the } that closes the templates dict
j = i + 1
while j < len(content) and content[j] != '}':
    j += 1

old_block = content[old_start:j+1]

new_block = '''templates = {
            "personal": [
                f"Hey {first_name}!\\n\\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting \\"Interested\\" on the event page helps other blues fans discover it.\\n\\n{url}",
                f"Hi {first_name}!\\n\\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click \\"Interested\\" on the event page—it really helps spread the word.\\n\\n{url}",
                f"Hey {first_name} — been a minute! Got a blues show coming up and you crossed my mind. Would be great to catch up and hear some live music. Tap \\"Interested\\" on the event page if you can make it.\\n\\n{url}",
            ],
            "casual": [
                f"Hey {first_name}!\\n\\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out when you get a chance, and if you're interested, click the \\"Interested\\" button on the event page - it helps with visibility!\\n\\n{url}",
                f"Yo {first_name}! Blues show coming up, thought you might wanna swing by. No pressure but clicking \\"Interested\\" on the event page really helps us out.\\n\\n{url}",
            ],
            "exciting": [
                f"Hey {first_name}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! And if you click \\"Interested\\" on the event page, it helps other blues lovers find us.\\n\\n{url}",
                f"{first_name}!! We're back with another blues night and it's gonna be a good one. Real good. Come vibe with us — and smash that \\"Interested\\" button on the event page to help us pack the room.\\n\\n{url}",
            ],
            "fomo": [
                f"Hi {first_name}!\\n\\nDon't miss out on this blues night we've got coming up! Great music, good times. Would love to have you there. Click \\"Interested\\" on the event page to help spread the word to other blues fans!\\n\\n{url}",
                f"Hey {first_name}, the last blues night was packed and this one's shaping up to be even bigger. Don't sleep on it! Hit \\"Interested\\" on the event page to lock it in and help spread the word.\\n\\n{url}",
            ],
            "warm": [
                f"Hi {first_name}! Thinking of you and wanted to personally invite you to our upcoming blues show. It would mean a lot to have you there. If you can, click \\"Interested\\" on the event page - every bit helps!\\n\\n{url}",
                f"Hey {first_name}, hope life's treating you well. Wanted to send a personal invite to our next blues show — always love having you in the room. \\"Interested\\" on the event page helps us reach more folks.\\n\\n{url}",
            ],
            "supportive": [
                f"Hey {first_name}!\\n\\nAs a fellow music lover, I wanted to reach out about our blues show. Your support would mean the world to us! Click \\"Interested\\" on the event page to help us reach more blues fans.\\n\\n{url}",
                f"Hi {first_name} — you've always supported live music and that means everything. Got another blues show coming up and I'd love to see you there. Clicking \\"Interested\\" on the event page goes a long way for us.\\n\\n{url}",
            ],
            "community": [
                f"Hi {first_name}!\\n\\nWe're building something special with this blues show and would love for you to be part of it. Come join the community! Help us spread the word by clicking \\"Interested\\" on the event page.\\n\\n{url}",
                f"Hey {first_name}! The blues community's growing and you're a big part of it. Next show's coming up — would love to see you there. Tap \\"Interested\\" on the event page to help us keep building.\\n\\n{url}",
            ],
            "direct": [
                f"Hey {first_name},\\n\\nBlues show coming up - you're invited! Click \\"Interested\\" on the event page to help with visibility.\\n\\n{url}",
                f"{first_name} — blues night, coming up soon. You in? Link below. \\"Interested\\" on the event page helps a ton.\\n\\n{url}",
            ],
            "curious": [
                f"Hey {first_name}!\\n\\nEver been to a live blues show that just hit different? We're creating one of those nights. Curious if you'd be into it? Click \\"Interested\\" on the event page and help other blues fans discover it too!\\n\\n{url}",
                f"Hi {first_name}! What's your go-to blues track? We're putting together a night of classics and deep cuts. Come check it out — \\"Interested\\" on the event page helps other blues lovers find us.\\n\\n{url}",
            ],
            "favor": [
                f"Hi {first_name}!\\n\\nQuick favor - would you mind checking out our upcoming blues event? I'd love your support! Clicking \\"Interested\\" on the event page really helps with visibility for blues fans in the area.\\n\\n{url}",
                f"Hey {first_name}, small ask — could you tap \\"Interested\\" on our blues event page? It costs nothing but really boosts our reach. And of course, would love to see you there!\\n\\n{url}",
            ],
            "nostalgic": [
                f"Hey {first_name}! Remember the last time we caught live music? Those were the nights. Got another blues show coming up — let's do it again. Tap \\"Interested\\" on the event page to help spread the word.\\n\\n{url}",
                f"Hi {first_name} — thinking back to some great nights of live music. Got another one coming up and you should be there. \\"Interested\\" on the event page helps us fill the room with the right people.\\n\\n{url}",
            ],
            "musician": [
                f"Hey {first_name}! As someone who knows good music when they hear it — our blues show is gonna deliver. Come through and bring your ears. \\"Interested\\" on the event page helps other music folks find us.\\n\\n{url}",
                f"Hi {first_name}, you know the blues better than most. We're putting on a night of the real stuff — Chicago blues, Delta blues, the classics. Would value having you in the room. Tap \\"Interested\\" on the event page to help us reach the right audience.\\n\\n{url}",
            ],
            "reconnect": [
                f"Hey {first_name}! It's been too long. What better way to reconnect than over some live blues? Got a show coming up — come hang. \\"Interested\\" on the event page helps us with visibility.\\n\\n{url}",
                f"Hi {first_name} — been way too long since I've seen you! I've got a blues night coming up and it'd be the perfect excuse to catch up. Click \\"Interested\\" on the event page and let's make it happen.\\n\\n{url}",
            ],
            "invite": [
                f"Hey {first_name}! Consider this your personal invite to our next blues night. Good music, good people, good vibes. Tap \\"Interested\\" on the event page to help us spread the word.\\n\\n{url}",
                f"Hi {first_name}! You're officially invited to our upcoming blues show. No plus-one needed — just bring yourself and your love for live music. \\"Interested\\" on the event page goes a long way!\\n\\n{url}",
            ],
            "bluesfan": [
                f"Hey {first_name}! If you love the blues — and I know you do — this night is for you. Muddy Waters, B.B. King, Howlin' Wolf, the real deal. Come through! \\"Interested\\" on the event page helps other blues heads find us.\\n\\n{url}",
                f"Hi {first_name}! We're doing a night of blues classics — the stuff that made the genre. If that's your jam, you need to be there. Tap \\"Interested\\" on the event page to help us reach more blues lovers.\\n\\n{url}",
            ],
        }'''

# Replace
new_content = content[:old_start] + new_block + content[j+1:]

with open('messenger_terminal.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Replaced templates block')
print('Old block:', len(old_block), 'chars')
print('New block:', len(new_block), 'chars')
print('File size:', len(content), '->', len(new_content))
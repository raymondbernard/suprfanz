# Facebook Messenger Campaign — Silvana Residency

## Overview

Send personalized FB Messenger messages to NY-area friends announcing the residency at Silvana. Separate from the event campaign — uses a different message and different event URL to prevent duplicate detection.

## How It Works

The existing `messenger_terminal.py` / `send_v3.js` infrastructure handles:
- NY location filter (from `contacts/fb_friend.csv`)
- Duplicate prevention (CSV + message_history.json)
- Auto-navigate + Continue button + type + send
- Bad profile marking
- Screenshots for debugging

For the residency campaign, we need a **second message_history.json** so it doesn't conflict with the event campaign.

## Message Templates (10 styles)

### Personal
```
Hey {first_name}!

Got some big news — we've got a new residency at Silvana in Harlem. You know Silvana? Sister to Shrine, same ownership. Live music every night, great food, real Harlem vibe.

I'll be there with The Cosmic Blues Band. Would love to see you come through. It's gonna be a whole thing.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Casual
```
Hey {first_name}!

Hope you're doing well. Just wanted to let you know we're starting a residency at Silvana in Harlem — right next to Shrine. Same energy, different room.

Come hang, grab a shawarma, hear some blues. No pressure but it'd be great to see you there.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Exciting
```
Hey {first_name}! Big news!

We've landed a residency at Silvana in Harlem — sister venue to the legendary Shrine. Same ownership, same fire, new room.

I'll be there with The Cosmic Blues Band bringing the sound that filled B.B. King's for a decade. Harlem nights, live blues, great food. This is gonna be special.

Come through!

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### FOMO
```
Hi {first_name}!

Don't miss out — we're starting a residency at Silvana in Harlem. Sister to Shrine, one of Harlem's most loved music venues.

If you know Shrine, you know the energy. This is that, but with cosmic blues. Come through before everyone finds out about it.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Warm
```
Hi {first_name}! Thinking of you and wanted to share some good news personally.

We've got a new residency at Silvana in Harlem — sister to Shrine. Same ownership, same love for live music. I'd really love to have you there.

Come grab a drink, hang out, hear some blues. It would mean a lot to see your face in the room.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Community
```
Hey {first_name}!

We're building something new in Harlem. Got a residency at Silvana — sister to Shrine, same family. Live blues, good people, Harlem energy.

This is more than a show, it's a gathering. Would love for you to be part of it from the beginning.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Favor
```
Hi {first_name}!

Quick favor — we're starting a residency at Silvana in Harlem (sister to Shrine). Would mean the world if you came through and showed some love.

Grab a shawarma, hang out, tell a friend. Every person who comes makes a difference for live blues in Harlem.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Direct
```
Hey {first_name},

New residency at Silvana in Harlem. Sister to Shrine. Cosmic Blues Band. Come through.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Curious
```
Hey {first_name}!

Ever been to Silvana in Harlem? Sister to Shrine, same ownership? We just landed a residency there and I think you'd love the vibe.

Live blues, Middle Eastern food, real Harlem energy. Come curious, leave a fan.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

### Supportive
```
Hey {first_name}!

As someone who loves live music, I wanted to reach out personally. We've got a new residency at Silvana in Harlem — sister to Shrine.

Your support means everything to us. If you can make it, come through. Every person in the room helps keep live blues alive in Harlem.

Silvana | 300 W. 116th St | Harlem
@silvanaharlem
```

## How to Run

1. Copy `fbfriends.csv` to `outreach/residency/` (or reference the existing one)
2. Create a new `residency_history.json` for this campaign (separate from event campaign)
3. Update `send_v3.js` with these message templates
4. Change the "already sent" check to look for "silvanaharlem" instead of the event ID
5. Run: `node send_residency.js`

## Duplicate Prevention

- **Event campaign**: checks for event URL/ID in conversation → skips if found
- **Residency campaign**: checks for "silvanaharlem" or "Silvana" in conversation → skips if found
- Both campaigns use separate history files
- A contact can receive BOTH the event invite AND the residency invite (different messages)
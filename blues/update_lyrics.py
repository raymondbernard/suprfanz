"""
Update all blues song sheets with lyrics from blues-lyrics-collection.txt
Each lyric section starts with '## Lyrics (vocal enters on the 1)' 
and marks the downbeat with '**(Bar 1, beat 1)**'
"""
import re
import os

# Read the lyrics collection
with open("blues-lyrics-collection.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Parse songs
songs = {}
blocks = content.split("---")
for block in blocks:
    block = block.strip()
    if not block:
        continue
    # Extract song name
    song_match = re.match(r'SONG:\s*(.+?)(?:\n|ARTIST)', block, re.DOTALL)
    lyrics_match = re.search(r'LYRICS:\s*\n(.+)', block, re.DOTALL)
    if song_match and lyrics_match:
        name = song_match.group(1).strip()
        lyrics = lyrics_match.group(1).strip()
        songs[name] = lyrics

# Map song names to file numbers
song_map = {
    "Going Down": "02-going-down",
    "Little Red Rooster": "03-little-red-rooster",
    "Rock Me Baby": "04-rock-me-baby",
    "King Bee (I'm a King Bee)": "05-king-bee",
    "Mannish Boy": "06-mannish-boy",
    "Red House": "07-red-house",
    "Rollin' and Tumblin'": "08-rollin-and-tumblin",
    "Back Door Man": "09-back-door-man",
    "Love Her With a Feeling": "10-love-her-with-a-feeling",
    "Dust My Broom": "11-dust-my-broom",
    "Stormy Monday (Call It Stormy Monday)": "12-stormy-monday",
    "Crossroads": "13-crossroads",
    "The Thrill Is Gone": "14-the-thrill-is-gone",
    "Born Under a Bad Sign": "15-born-under-a-bad-sign",
    "Sunshine of Your Love": "16-sunshine-of-your-love",
    "Hoochie Coochie Man (I'm Your Hoochie Coochie Man)": "17-hoochie-coochie-man",
    "Tobacco Road": "18-tobacco-road",
    "Key to the Highway": "19-key-to-the-highway",
    "Boom Boom": "20-boom-boom",
    "Spoonful": "21-spoonful",
    "Bad Bad Whiskey": "22-bad-bad-whiskey",
    "Alabama Train": "23-alabama-train",
    "Champagne and Reefer": "24-champagne-and-reefer",
    "Sweet Little Angel": "25-sweet-little-angel",
    "Bad to the Bone": "26-bad-to-the-bone",
    "La Grange": "27-la-grange",
    "Baby Please Don't Go": "28-baby-please-dont-go",
    "I Put a Spell on You": "29-i-put-a-spell-on-you",
    "I Got Mine": "30-i-got-mine",
}

songs_dir = "blues/songs"
updated = 0
skipped = 0

for song_name, filename in song_map.items():
    filepath = os.path.join(songs_dir, f"{filename}.md")
    
    if song_name not in songs:
        print(f"SKIP (no lyrics found): {filename}")
        skipped += 1
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        sheet = f.read()
    
    # Check if lyrics section already exists
    if "## Lyrics" in sheet:
        print(f"SKIP (already has lyrics): {filename}")
        skipped += 1
        continue
    
    lyrics = songs[song_name]
    
    # Format lyrics: add **(Bar 1, beat 1)** marker at the start
    # Split into lines, mark the first vocal line
    lyric_lines = lyrics.split("\n")
    formatted_lines = ["## Lyrics (vocal enters on the 1)", ""]
    first_line_marked = False
    
    for line in lyric_lines:
        line = line.strip()
        if not line:
            formatted_lines.append("")
            continue
        if not first_line_marked and line and not line.startswith("("):
            formatted_lines.append(f"**(Bar 1, beat 1)** {line}")
            first_line_marked = True
        else:
            formatted_lines.append(line)
    
    formatted_lines.append("")
    lyrics_section = "\n".join(formatted_lines)
    
    # Insert lyrics before the ## Notes section
    if "## Notes" in sheet:
        sheet = sheet.replace("## Notes", lyrics_section + "## Notes")
    else:
        # Append at end
        sheet = sheet + "\n\n" + lyrics_section
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(sheet)
    
    print(f"OK: {filename}")
    updated += 1

print(f"\nUpdated: {updated}, Skipped: {skipped}")
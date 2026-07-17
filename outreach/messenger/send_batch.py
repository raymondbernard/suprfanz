#!/usr/bin/env python3
"""Direct send script - bypasses the interactive menu, sends to NY contacts directly."""
import sys
sys.path.insert(0, '.')
exec(open('messenger_terminal.py').read())

app = MessengerTerminal()
contacts = app.load_contacts(ny_only=True)
print(f"\nNY pending contacts: {len(contacts)}")
print(f"Event: {app.event.title}")
print(f"Event URL: {app.event.url}")
print(f"\nFirst 5 contacts:")
for c in contacts[:5]:
    print(f"  {c.fb_name} - {c.messenger_url}")

if not contacts:
    print("No contacts to send to!")
    sys.exit(0)

# Run batch of 5 with auto-confirm
print("\nStarting batch of 5...")
app.run_batch(contacts[:5], dry_run=False, batch_size=5, confirm_each=False)
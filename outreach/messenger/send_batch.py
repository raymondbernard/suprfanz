#!/usr/bin/env python3
"""Non-interactive batch sender for messenger outreach."""
import sys
import os

# Add the messenger dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Read and exec the messenger terminal module
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'messenger_terminal.py'), 'r', encoding='utf-8') as f:
    code = f.read()

# Execute the code in a namespace
ns = {}
exec(code, ns)

MessengerTerminal = ns.get('MessengerTerminal')
if not MessengerTerminal:
    print('ERROR: MessengerTerminal class not found')
    sys.exit(1)

# Create app
app = MessengerTerminal()

# Load contacts
batch_size = 5
if len(sys.argv) > 1:
    batch_size = int(sys.argv[1])

contacts = app.load_contacts(limit=0, only_pending=True, ny_only=False)
print('Pending contacts: %d' % len(contacts))
print('Batch size: %d' % batch_size)
print()

# Run batch with auto-confirm (no user interaction needed)
# auto_confirm=False means it asks "type yes to confirm" — we'll pipe that
# Let's just call run_batch with confirm_each=False
app.run_batch(contacts, dry_run=False, batch_size=batch_size, confirm_each=False)
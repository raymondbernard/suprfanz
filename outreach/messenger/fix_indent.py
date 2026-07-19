with open('messenger_terminal.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the new templates block (starts with 'templates = {\n')
old_start = content.find('templates = {\n')
if old_start < 0:
    print('No newline-starting templates found')
    exit(1)

# Find the end of the new block — it ends with '}\n        '
# Actually let's find the next line that has the if statement after templates
# The pattern after templates is:  if style and style in templates:
after_marker = 'if style and style in templates:'
after_idx = content.find(after_marker)
if after_idx < 0:
    print('No "if style" marker found')
    exit(1)

# The templates block ends just before 'if style'
# Go back to find the closing
block = content[old_start:after_idx]
print('Block length:', len(block))
print('Starts with:', repr(block[:50]))
print('Ends with:', repr(block[-50:]))

# Flatten: remove all newlines and extra spaces from the block
# But keep the f-string content intact (the \n in the strings are already escaped)
flattened = block.replace('\n            ', ' ').replace('\n        ', ' ').replace('\n', ' ')
# Also fix multiple spaces
import re
flattened = re.sub(r'  +', ' ', flattened)
# But preserve the leading spaces before templates
leading = content[old_start-12:old_start]
flattened = leading + flattened.strip()

new_content = content[:old_start-12] + flattened + content[after_idx:]

with open('messenger_terminal.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Flattened templates block')
print('New file size:', len(new_content))
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const csv = require('csv-parse/sync');
const readline = require('readline');

// Event details
const EVENT = {
  title: "Cosmic Blues Band Live",
  date: "Upcoming",
  venue: "TBD",
  url: "https://www.facebook.com/events/971902445574502",
  description: "A night of blues and roots music with the Cosmic Blues Band!"
};

async function loadContacts() {
  const content = fs.readFileSync('./fbfriends.csv', 'utf8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  return records.filter(r => !r.message_sent || r.message_sent === '');
}

function generateMessage(contact) {
  const firstName = contact.fb_first_name;
  const styles = [
    `Hi ${firstName}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT.url}`,
    `Hey ${firstName}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT.url}`,
    `Hi ${firstName}!\n\n${EVENT.description}\n\nClick "Interested" here if you're curious: ${EVENT.url}`,
    `Hey ${firstName}!\n\nHope you're doing well! I've got a blues gig coming up and would love to see your face in the crowd. Mind clicking "Interested" on the event? It helps with the algorithm.\n\n${EVENT.url}`,
    `Hi ${firstName}!\n\nLong time no see! I'm playing a blues show soon—come through if you're free. Clicking "Interested" on the event page really helps get the word out.\n\n${EVENT.url}`
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('🎸 Messenger Skill - Pick a Contact to Test');
  console.log('=============================================\n');
  console.log(`Event: ${EVENT.title}`);
  console.log(`URL: ${EVENT.url}\n`);
  console.log('⚠️  TEST MODE - No messages will be sent\n');

  const contacts = await loadContacts();
  console.log(`Found ${contacts.length} contacts who haven't been messaged yet.\n`);

  // Show first 20 contacts as options
  const displayCount = Math.min(20, contacts.length);
  console.log('Select a contact to preview message:');
  console.log('------------------------------------');
  
  for (let i = 0; i < displayCount; i++) {
    const c = contacts[i];
    console.log(`${i + 1}. ${c.fb_name} (${c.fb_profile_id})`);
  }
  
  if (contacts.length > 20) {
    console.log(`... and ${contacts.length - 20} more`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await askQuestion(rl, '\nEnter number (1-' + displayCount + ') or name to search: ');
  
  let selectedContact;
  const num = parseInt(answer);
  
  if (!isNaN(num) && num >= 1 && num <= displayCount) {
    selectedContact = contacts[num - 1];
  } else {
    // Search by name
    const search = answer.toLowerCase();
    const matches = contacts.filter(c => 
      c.fb_name.toLowerCase().includes(search) || 
      c.fb_first_name.toLowerCase().includes(search)
    );
    
    if (matches.length === 0) {
      console.log('\n❌ No contacts found matching: ' + answer);
      rl.close();
      return;
    } else if (matches.length === 1) {
      selectedContact = matches[0];
    } else {
      console.log('\nMultiple matches found:');
      matches.slice(0, 10).forEach((c, i) => {
        console.log(`${i + 1}. ${c.fb_name} (${c.fb_profile_id})`);
      });
      const matchAnswer = await askQuestion(rl, '\nEnter number: ');
      const matchNum = parseInt(matchAnswer);
      if (!isNaN(matchNum) && matchNum >= 1 && matchNum <= matches.length) {
        selectedContact = matches[matchNum - 1];
      }
    }
  }

  rl.close();

  if (!selectedContact) {
    console.log('\n❌ No contact selected.');
    return;
  }

  console.log('\n' + '='.repeat(50));
  console.log('PREVIEW MESSAGE');
  console.log('='.repeat(50));
  console.log(`\nTo: ${selectedContact.fb_name}`);
  console.log(`Profile: ${selectedContact.fb_profile_id}`);
  console.log(`Messenger URL: https://www.messenger.com/t${selectedContact.fb_profile_id}`);
  console.log('\n--- MESSAGE ---');
  console.log(generateMessage(selectedContact));
  console.log('---\n');
  console.log('✅ This is a PREVIEW. No message was sent.');
  console.log('\nMessenger conversation would open at:');
  console.log(`https://www.messenger.com/t${selectedContact.fb_profile_id}`);
}

main().catch(console.error);

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync('./firestore.rules', 'utf8');
const blueprint = JSON.parse(fs.readFileSync('./firebase-blueprint.json', 'utf8'));

test('firestore.rules enforces default-deny catch-all and rules_version 2', () => {
  assert.ok(rulesContent.includes("rules_version = '2';"));
  assert.ok(rulesContent.includes('match /{document=**}'));
  assert.ok(rulesContent.includes('allow read, write: if false;'));
});

test('firestore.rules enforces Dirty Dozen guards (verified email, strict keys, immutable fields, size bounds)', () => {
  // 1. Identity Spoofing guard
  assert.ok(rulesContent.includes('data.userId == request.auth.uid'));
  // 2. Email spoofing guard
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  // 3. Shadow field injection guard on create
  assert.ok(rulesContent.includes('data.keys().hasAll(['));
  assert.ok(rulesContent.includes('data.keys().hasOnly(['));
  // 4. Shadow field injection guard on update
  assert.ok(rulesContent.includes('incoming().diff(existing()).affectedKeys().hasOnly(['));
  // 5. Immutable userId and createdAt on update
  assert.ok(rulesContent.includes('incoming().userId == existing().userId'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  // 6. Server timestamp enforcement
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  // 7. ID poisoning guard
  assert.ok(rulesContent.includes('isValidId(presetId)'));
  // 8. Query enforcer on list
  assert.ok(rulesContent.includes('allow list: if isSignedIn() && existing().userId == request.auth.uid;'));
  // 9. Blueprint collection match
  assert.ok(blueprint.firestore['/presets/{presetId}']);
  assert.ok(rulesContent.includes('match /presets/{presetId}'));
});

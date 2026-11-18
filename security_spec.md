# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership**: Every document in `/presets/{presetId}` must belong to the authenticated user (`userId == request.auth.uid`) with a verified email (`request.auth.token.email_verified == true`).
2. **No Blanket Reads**: `get` and `list` operations on `/presets/{presetId}` are strictly restricted to documents where `resource.data.userId == request.auth.uid`.
3. **Strict Schema & Volumetric Bounds**: Every string field enforces exact minimum/maximum character lengths and enum constraints matching `firebase-blueprint.json`. No extra or shadow keys are allowed (`hasOnly`).
4. **Temporal & Identity Immutability**: `createdAt` must equal `request.time` on creation and remain immutable on update. `updatedAt` must equal `request.time` on creation and update. `userId` is immutable after creation.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Create**: `{ "userId": "other_user_123", "title": "سيلفي", ... }` -> Rejected (`userId != request.auth.uid`).
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creating a preset -> Rejected (`request.auth.token.email_verified == true` check fails).
3. **Shadow Field Injection on Create**: Payload containing `"isAdmin": true` -> Rejected (`data.keys().hasOnly(...)` fails).
4. **Shadow Field Injection on Update**: Payload adding `"role": "admin"` -> Rejected (`affectedKeys().hasOnly(...)` fails).
5. **Owner Transfer on Update**: Updating `userId` to another UID -> Rejected (`userId` not in `affectedKeys().hasOnly(...)` and `incoming().userId == existing().userId`).
6. **Immutable Timestamp Tampering**: Modifying `createdAt` on update -> Rejected (`incoming().createdAt == existing().createdAt`).
7. **Client-Forged Timestamp**: Passing a past/future timestamp instead of `request.time` -> Rejected (`incoming().updatedAt == request.time`).
8. **Resource Poisoning (Oversized Prompt)**: `promptText` with 10,000 chars -> Rejected (`promptText.size() <= 2500`).
9. **ID Poisoning**: Document ID with special characters or > 128 chars -> Rejected (`isValidId(presetId)`).
10. **Invalid Enum Value**: `selfieType: "drone_shot"` -> Rejected (`selfieType in ['front_camera', 'mirror']`).
11. **Unauthorized List Scraping**: Listing `/presets` without filtering `userId == request.auth.uid` -> Rejected (`resource.data.userId == request.auth.uid`).
12. **Value Poisoning on Update**: Updating `title` to a number `12345` -> Rejected (`isValidPromptPreset(incoming())` wraps the entire update block).

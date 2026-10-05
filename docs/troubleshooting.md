# Troubleshooting & Operational Guide

This document addresses common edge cases, binary decoding questions, and infrastructure resolutions.

---

## 1. FlightRecord V13 / V14 Decryption & Partial Status

### Symptom: Flight status is marked as `PARTIAL` with "Keychains required for v13+ logs".
- **Reason**: Starting with DJI FlightRecord version 13, DJI encrypts the high-frequency telemetry payload with AES keys stored across feature points. The header and flight details block remain readable without decryption.
- **Resolution**:
  1. This is normal and expected when operating without a DJI developer API key.
  2. The application extracts flight metadata (aircraft serial, battery serial, takeoff coordinates, max altitude, max speed, total distance, duration) without decryption.
  3. If you obtain a DJI API key, set `DJI_API_KEY=<your_key>` in your environment and trigger **Reprocess** on the flight details or file inspector screen.

---

## 2. DAT Files (`FLY022.DAT`) Ingestion Behavior

### Symptom: Uploading a 96MB `FLY022.DAT` results in `UNSUPPORTED_DECODER` or `PARTIAL`.
- **Reason**: DJI DAT files are internal proprietary black-box flight recorder files (`DJI_LOG_V3T`). They differ completely from mobile app FlightRecord `.txt` files.
- **Resolution**:
  1. The platform automatically fingerprints the file, verifies the `DJI_LOG_V3T` signature and build timestamp string, records its exact byte size, and immutably archives the file into S3/MinIO.
  2. Per Rule 9, the platform never invents fake telemetry.
  3. When DAT decoding routines are expanded in future updates, click **Reprocess File** in the file inspector to re-parse against the new parser capability matrix.

---

## 3. Duplicate File Uploads

### Symptom: `409 Conflict: This file already exists.`
- **Reason**: The platform hashes every uploaded file with SHA-256 before ingestion.
- **Resolution**: The user interface provides a direct clickable link to the previously associated flight. No storage space or database overhead is wasted on duplicate ingestions.

---

## 4. Multi-File Automatic Association

### Scenario: Uploading both `DJIFlightRecord_...txt` and companion metadata cache `DJIFlightRecord_...txt_275337`.
- The companion parser extracts the flight UUID and device serial numbers.
- The flight association engine detects the matching aircraft serial, timestamp window (within ±30 seconds), and UUID, automatically grouping them under the exact same flight record with an association confidence of `1.0`.

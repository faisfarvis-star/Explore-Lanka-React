#!/usr/bin/env node
/**
 * Import Sri Lanka Tourism Dataset into explore_lanka_db.hotels
 * ============================================================
 * File: database/import-tourism-dataset.js
 * Usage: node database/import-tourism-dataset.js
 *
 * Safe & repeatable:
 *   - Never drops or truncates existing data
 *   - Deduplicates by registration_number (when present) or
 *     normalised name + district
 *   - Excludes Restaurant and Tourist Friendly Eating Place types
 *   - Marks every imported row with dataset_source='sltda_import'
 *   - Prints an import summary at the end
 */

import XLSX   from 'xlsx';
import mysql  from 'mysql2/promise';
import path   from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbConfig } from './db-config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

// ── Accommodation types to EXCLUDE (food/dining only) ────────────────────
const EXCLUDED_TYPES = new Set([
  'Restaurant',
  'Tourist Friendly Eating Place',
]);

// ── Normalise a string for fuzzy dedup ───────────────────────────────────
function normalise(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ── Build a URL-friendly slug ─────────────────────────────────────────────
function slugify(name, district) {
  return `${name}-${district}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
}

// ── Map licence/record status to a short label ───────────────────────────
function shortRecordStatus(rawRecord) {
  const r = String(rawRecord || '').toLowerCase();
  if (r.includes('official')) return 'official';
  if (r.includes('historical') && r.includes('travel')) return 'historical';
  if (r.includes('historical')) return 'historical';
  if (r.includes('travel')) return 'travel-site';
  if (r.includes('public')) return 'travel-site';
  return 'unverified';
}

// ── Map star rating ───────────────────────────────────────────────────────
function parseStar(val) {
  const n = parseFloat(val);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
  return 0; // 0 = unrated / not a hotel
}

// ── Parse phone, only keep if it looks valid ─────────────────────────────
function parsePhone(val) {
  const s = String(val || '').trim().replace(/\s+/g, '');
  return s.length >= 7 ? s.slice(0, 30) : null;
}

// ── Parse latitude/longitude ──────────────────────────────────────────────
function parseCoord(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = path.join(root, 'Sri_Lanka_Tourism_Dataset111.xlsx');
  console.log('Reading:', xlsxPath);

  const wb   = XLSX.readFile(xlsxPath);
  const ws   = wb.Sheets['Full dataset'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const headers  = rows[0];
  const col = (name) => headers.findIndex(h => String(h).toLowerCase() === name.toLowerCase());

  const C = {
    district:      col('District'),
    name:          col('Name'),
    type:          col('Type'),
    rooms:         col('Rooms'),
    address:       col('Address'),
    phone:         col('Phone'),
    mobile:        col('Mobile'),
    email:         col('Email'),
    latitude:      col('Latitude'),
    longitude:     col('Longitude'),
    grade:         col('Grade'),
    star:          col('Star Rating'),
    website:       col('Website'),
    bookingLink:   col('Booking Link'),
    regNum:        col('Registration Number'),
    licenceStatus: col('Licence Status'),
    recordStatus:  col('Record Status'),
    notes:         col('Notes'),
  };

  const pool = mysql.createPool(getDbConfig());

  // Load existing dedup keys
  const [existing] = await pool.query(
    "SELECT hotel_id, hotel_name, district, registration_number FROM hotels"
  );
  const existingByReg  = new Map(); // regNum -> hotel_id
  const existingByName = new Set(); // "normalised_name|district"
  for (const row of existing) {
    if (row.registration_number) existingByReg.set(row.registration_number.trim(), row.hotel_id);
    existingByName.add(`${normalise(row.hotel_name)}|${normalise(row.district)}`);
  }

  let inserted = 0, skipped = 0, excluded = 0, errors = 0;

  for (let i = 1; i < rows.length; i++) {
    const r       = rows[i];
    const rawType = String(r[C.type] || '').trim();

    // Skip food/dining entries
    if (EXCLUDED_TYPES.has(rawType)) { excluded++; continue; }

    const rawName     = String(r[C.name]     || '').trim();
    const rawDistrict = String(r[C.district] || '').trim();
    if (!rawName || !rawDistrict) { skipped++; continue; }

    const rawReg = String(r[C.regNum] || '').trim();

    // Dedup by registration number
    if (rawReg && existingByReg.has(rawReg)) { skipped++; continue; }

    // Dedup by normalised name + district
    const nameKey = `${normalise(rawName)}|${normalise(rawDistrict)}`;
    if (existingByName.has(nameKey)) { skipped++; continue; }

    const rawLicence = String(r[C.licenceStatus] || '').trim();
    const rawRecord  = String(r[C.recordStatus]  || '').trim();
    const star       = parseStar(r[C.star]);
    const rooms      = parseInt(r[C.rooms], 10);
    const lat        = parseCoord(r[C.latitude]);
    const lng        = parseCoord(r[C.longitude]);

    // Build a short description
    const parts = [];
    if (rawType)                    parts.push(rawType);
    if (rawDistrict)                parts.push(`${rawDistrict} district`);
    if (star > 0)                   parts.push(`${star}-star`);
    const gradeVal = String(r[C.grade] || '').trim();
    if (gradeVal)                   parts.push(`Grade ${gradeVal}`);
    if (rawLicence)                 parts.push(rawLicence);

    const shortDesc = parts.join(' · ').slice(0, 400);

    // Notes + record status for description
    const notesText = String(r[C.notes] || '').trim();
    const description = [
      `${rawName} is a ${rawType.toLowerCase()} located in ${rawDistrict} district, Sri Lanka.`,
      rawLicence ? `Licence: ${rawLicence}.` : '',
      rawRecord  ? `Data source: ${rawRecord.substring(0, 120)}.` : '',
      notesText  ? notesText.slice(0, 300) : '',
    ].filter(Boolean).join(' ').slice(0, 2000);

    const addressVal = String(r[C.address] || rawDistrict).trim().slice(0, 300) || rawDistrict;
    const cityVal    = String(r[C.address] || '').split(',')[0].trim().slice(0, 100) || rawDistrict;

    try {
      await pool.execute(
        `INSERT INTO hotels
           (hotel_name, slug, description, short_desc, address, city, district,
            accommodation_type, latitude, longitude, phone, mobile, email,
            website, booking_link, star_category, grade, registration_number,
            licence_status, record_status, facilities, status, dataset_source)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          rawName.slice(0, 200),
          slugify(rawName, rawDistrict),
          description,
          shortDesc || null,
          addressVal,
          cityVal,
          rawDistrict.slice(0, 100),
          rawType.slice(0, 80),
          lat,
          lng,
          parsePhone(r[C.phone]),
          parsePhone(r[C.mobile]),
          String(r[C.email] || '').trim().slice(0, 100) || null,
          String(r[C.website]     || '').trim().slice(0, 255) || null,
          String(r[C.bookingLink] || '').trim().slice(0, 500) || null,
          star > 0 ? star : 0,
          gradeVal.slice(0, 50) || null,
          rawReg.slice(0, 100) || null,
          rawLicence.slice(0, 100) || null,
          shortRecordStatus(rawRecord),
          Number.isFinite(rooms) && rooms > 0 ? `${rooms} rooms` : null,
          'active',
          'sltda_import',
        ]
      );

      // Track for in-memory dedup
      if (rawReg) existingByReg.set(rawReg, true);
      existingByName.add(nameKey);
      inserted++;

      if (inserted % 500 === 0) process.stdout.write(`  ${inserted} records inserted…\r`);
    } catch (err) {
      console.error(`  Row ${i}: ERROR — ${err.message.slice(0, 80)}`);
      errors++;
    }
  }

  await pool.end();

  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Import complete');
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}  (duplicates)`);
  console.log(`  Excluded : ${excluded}  (restaurants/dining)`);
  console.log(`  Errors   : ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });

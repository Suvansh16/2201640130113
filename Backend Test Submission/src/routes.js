// src/routes.js
import express from 'express';
import { AppError } from './errors.js';
import { getRecord, putRecord, existsShortcode, incrementAndRecordClick } from './storage.js';
import { isValidUrl, validateShortcodeOrThrow, generateShortcode, expiryFromMinutes } from './utils.js';
import geoip from 'geoip-lite';

const router = express.Router();

/**
 * POST /shorturls
 * body: { url: string (required), validity?: integer (minutes), shortcode?: string (optional) }
 * response: 201 { shortLink, expiry }
 */
router.post('/shorturls', (req, res, next) => {
  try {
    const { url, validity, shortcode } = req.body || {};

    if (!url || !isValidUrl(url)) {
      throw new AppError('A valid http/https url is required', 400, 'INVALID_URL');
    }

    let code = shortcode?.trim();

    // if custom shortcode provided, validate & check uniqueness
    if (code) {
      validateShortcodeOrThrow(code);
      if (existsShortcode(code)) throw new AppError('shortcode already in use', 409, 'SHORTCODE_IN_USE');
    } else {
      // auto-generate until unique
      do {
        code = generateShortcode();
      } while (existsShortcode(code));
    }

    const now = new Date();
    const expiresAt = expiryFromMinutes(validity);

    const record = {
      shortcode: code,
      originalUrl: url,
      createdAt: now,
      expiry: expiresAt,
      hits: 0,
      lastAccess: null,
      clicks: []
    };

    putRecord(record);

    if (req.log) req.log.info('short_url_created', { shortcode: code, url });

    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    // Return expiry in ISO UTC string
    res.status(201).json({
      shortLink: `${base}/${code}`,
      expiry: expiresAt.toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /shorturls/:shortcode
 * returns analytics JSON for shortcode
 */
router.get('/shorturls/:shortcode', (req, res, next) => {
  try {
    const code = req.params.shortcode;
    const rec = getRecord(code);
    if (!rec) throw new AppError('shortcode not found', 404, 'NOT_FOUND');

    res.json({
      shortcode: rec.shortcode,
      originalUrl: rec.originalUrl,
      createdAt: rec.createdAt.toISOString(),
      expiry: rec.expiry.toISOString(),
      totalClicks: rec.hits,
      clicks: rec.clicks.map(c => ({
        timestamp: c.timestamp.toISOString(),
        referrer: c.referrer,
        userAgent: c.userAgent,
        country: c.country || 'Unknown'
      })),
      active: new Date() < new Date(rec.expiry)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:shortcode -> redirect to original URL
 * Logs click with timestamp, referrer, user-agent, geo country
 */
router.get('/:shortcode', (req, res, next) => {
  try {
    const code = req.params.shortcode;
    const rec = getRecord(code);
    if (!rec) throw new AppError('shortcode not found', 404, 'NOT_FOUND');

    if (new Date() > new Date(rec.expiry)) {
      if (req.log) req.log.warn('expired_shortlink_access', { shortcode: code });
      throw new AppError('short link expired', 410, 'EXPIRED');
    }

    // Geo IP (coarse) from request IP
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const geo = geoip.lookup(ip) || null;
    const country = geo?.country || 'Unknown';

    const click = {
      timestamp: new Date(),
      referrer: req.get('Referer') || null,
      userAgent: req.get('User-Agent') || null,
      country
    };

    incrementAndRecordClick(code, click);

    if (req.log) req.log.info('redirect', { shortcode: code, to: rec.originalUrl });

    // Use 302 Found redirect
    res.redirect(302, rec.originalUrl);
  } catch (err) {
    next(err);
  }
});

export default router;

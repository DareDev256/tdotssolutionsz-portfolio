#!/usr/bin/env node
/**
 * Fetch YouTube Data Script
 * 
 * Fetches real view counts, upload dates, and metadata from YouTube API
 * and writes enriched data to public/videos-enriched.json
 * 
 * Usage: node scripts/fetch-youtube-data.js
 * Requires: YOUTUBE_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// File paths
const INPUT_FILE = path.join(PROJECT_ROOT, 'src/data/videos.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public/videos-enriched.json');

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

/** YouTube video IDs are exactly 11 chars: alphanumeric plus - and _ */
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Build-time validation: reject malformed YouTube IDs before they reach
 * the API or get bundled into the client-side JSON payload.
 */
function validateVideoIds(videos) {
    const invalid = videos.filter(v => !YT_ID_RE.test(v.youtubeId));
    if (invalid.length > 0) {
        console.error('❌ Invalid YouTube IDs detected at build time:');
        for (const v of invalid) {
            console.error(`   - id=${v.id} youtubeId="${v.youtubeId}" title="${v.title}"`);
        }
        process.exit(1);
    }
    const ids = videos.map(v => v.youtubeId);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
        console.error(`❌ Duplicate YouTube IDs: ${[...new Set(dupes)].join(', ')}`);
        process.exit(1);
    }
}

async function fetchVideoData(videoIds) {
    if (!YOUTUBE_API_KEY) {
        console.warn('⚠️  YOUTUBE_API_KEY not set - using placeholder data');
        return null;
    }

    const ids = videoIds.join(',');
    const url = `${YOUTUBE_API_URL}?part=snippet,statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('❌ Failed to fetch YouTube data:', error.message);
        return null;
    }
}

async function main() {
    console.log('📹 Fetching YouTube video data...\n');

    // Read input file
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Input file not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    const inputData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    const videos = inputData.videos;
    const settings = inputData.settings;

    console.log(`📋 Found ${videos.length} videos to process`);

    // Build-time security: validate all YouTube IDs before processing
    validateVideoIds(videos);
    console.log('✅ All YouTube IDs pass validation');

    // Extract YouTube IDs
    const videoIds = videos.map(v => v.youtubeId);

    // Fetch data from YouTube API
    const youtubeData = await fetchVideoData(videoIds);

    // Build enriched video data
    const enrichedVideos = videos.map(video => {
        // Find matching YouTube data
        const ytVideo = youtubeData?.items?.find(item => item.id === video.youtubeId);

        if (ytVideo) {
            // Use real YouTube data
            return {
                ...video,
                viewCount: parseInt(ytVideo.statistics.viewCount, 10) || video.viewCount,
                uploadDate: ytVideo.snippet.publishedAt?.split('T')[0] || video.uploadDate,
                thumbnail: ytVideo.snippet.thumbnails?.maxres?.url 
                    || ytVideo.snippet.thumbnails?.high?.url
                    || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
                duration: ytVideo.contentDetails?.duration || null,
                channelTitle: ytVideo.snippet.channelTitle || null,
            };
        } else {
            // Use existing data with default thumbnail
            return {
                ...video,
                thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
            };
        }
    });

    // Build output data
    const outputData = {
        videos: enrichedVideos,
        settings,
        lastFetched: new Date().toISOString(),
        apiKeyUsed: !!YOUTUBE_API_KEY,
    };

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

    console.log(`\n✅ Enriched data written to: ${OUTPUT_FILE}`);
    console.log(`   - ${enrichedVideos.length} videos processed`);
    console.log(`   - API key used: ${outputData.apiKeyUsed ? 'Yes' : 'No (placeholder data)'}`);
    console.log(`   - Timestamp: ${outputData.lastFetched}`);
}

main().catch(console.error);

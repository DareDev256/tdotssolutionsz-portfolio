#!/usr/bin/env node
/**
 * Fix Video IDs Script
 *
 * Searches YouTube by video title, finds correct matches using fuzzy matching,
 * and updates videos.json with accurate IDs, upload dates, and view counts.
 *
 * Usage: node scripts/fix-video-ids.js
 * Requires: YOUTUBE_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// File paths
const VIDEOS_FILE = path.join(PROJECT_ROOT, 'src/data/videos.json');
const BACKUP_FILE = path.join(PROJECT_ROOT, 'src/data/videos.backup.json');

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Matching configuration
const MATCH_THRESHOLD = 40; // Minimum score to accept a match
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate fuzzy match score between two strings
 * Returns a score from 0-100
 */
function calculateMatchScore(searchTitle, resultTitle) {
    const normalizeStr = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const searchNorm = normalizeStr(searchTitle);
    const resultNorm = normalizeStr(resultTitle);

    let score = 0;

    // Exact match = 100 points
    if (searchNorm === resultNorm) {
        return 100;
    }

    // Result contains the search title = 50 points
    if (resultNorm.includes(searchNorm)) {
        score += 50;
    }

    // Search title contains the result = 40 points
    if (searchNorm.includes(resultNorm)) {
        score += 40;
    }

    // Word overlap scoring (up to 40 points)
    const searchWords = searchNorm.split(/\s+/).filter(w => w.length > 2);
    const resultWords = resultNorm.split(/\s+/).filter(w => w.length > 2);

    if (searchWords.length > 0) {
        const matchingWords = searchWords.filter(word =>
            resultWords.some(rw => rw.includes(word) || word.includes(rw))
        );
        const overlapRatio = matchingWords.length / searchWords.length;
        score += Math.round(overlapRatio * 40);
    }

    return Math.min(score, 100);
}

/**
 * Search YouTube for a video by title
 */
async function searchYouTube(title, retryCount = 0) {
    if (!YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY environment variable not set');
    }

    const params = new URLSearchParams({
        part: 'snippet',
        q: title,
        type: 'video',
        maxResults: '10',
        key: YOUTUBE_API_KEY
    });

    const url = `${SEARCH_API_URL}?${params}`;

    try {
        const response = await fetch(url);

        if (response.status === 429) {
            // Rate limited - exponential backoff
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
                console.log(`   ⏳ Rate limited, waiting ${delay}ms...`);
                await sleep(delay);
                return searchYouTube(title, retryCount + 1);
            }
            throw new Error('Rate limit exceeded after retries');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`YouTube API error: ${response.status} - ${error.error?.message || 'Unknown'}`);
        }

        return await response.json();
    } catch (error) {
        if (retryCount < MAX_RETRIES && error.code === 'ENOTFOUND') {
            const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.log(`   ⏳ Network error, retrying in ${delay}ms...`);
            await sleep(delay);
            return searchYouTube(title, retryCount + 1);
        }
        throw error;
    }
}

/**
 * Find the best matching video from search results
 */
function findBestMatch(searchTitle, searchResults) {
    if (!searchResults?.items?.length) {
        return null;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const item of searchResults.items) {
        const resultTitle = item.snippet.title;
        const score = calculateMatchScore(searchTitle, resultTitle);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = {
                youtubeId: item.id.videoId,
                title: resultTitle,
                channelTitle: item.snippet.channelTitle,
                score
            };
        }
    }

    if (bestScore >= MATCH_THRESHOLD) {
        return bestMatch;
    }

    return null;
}

/**
 * Fetch video statistics for multiple video IDs
 */
async function fetchVideoStats(videoIds) {
    if (!videoIds.length) return {};

    const params = new URLSearchParams({
        part: 'snippet,statistics',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY
    });

    const url = `${VIDEOS_API_URL}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('   ⚠️  Failed to fetch video statistics');
            return {};
        }

        const data = await response.json();
        const stats = {};

        for (const item of data.items || []) {
            stats[item.id] = {
                viewCount: parseInt(item.statistics.viewCount, 10) || 0,
                uploadDate: item.snippet.publishedAt?.split('T')[0] || null,
                thumbnail: item.snippet.thumbnails?.maxres?.url
                    || item.snippet.thumbnails?.high?.url
                    || `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`
            };
        }

        return stats;
    } catch (error) {
        console.warn('   ⚠️  Error fetching stats:', error.message);
        return {};
    }
}

async function main() {
    console.log('🔧 Fix Video IDs Script');
    console.log('========================\n');

    // Check API key
    if (!YOUTUBE_API_KEY) {
        console.error('❌ Error: YOUTUBE_API_KEY environment variable not set');
        console.log('\nUsage:');
        console.log('  export YOUTUBE_API_KEY="your-api-key"');
        console.log('  npm run fix-ids');
        process.exit(1);
    }

    // Read input file
    if (!fs.existsSync(VIDEOS_FILE)) {
        console.error(`❌ Videos file not found: ${VIDEOS_FILE}`);
        process.exit(1);
    }

    const inputData = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
    const videos = inputData.videos;
    const settings = inputData.settings;

    console.log(`📋 Processing ${videos.length} videos...\n`);

    // Create backup
    console.log('💾 Creating backup...');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(inputData, null, 2));
    console.log(`   Saved to: ${BACKUP_FILE}\n`);

    // Process each video
    const updatedVideos = [];
    const matchedIds = [];
    const warnings = [];

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        console.log(`[${i + 1}/${videos.length}] "${video.title}"`);

        try {
            // Search YouTube
            const searchResults = await searchYouTube(video.title);
            const match = findBestMatch(video.title, searchResults);

            if (match) {
                console.log(`   ✓ Found: "${match.title}" (score: ${match.score})`);
                console.log(`   📺 Channel: ${match.channelTitle}`);
                console.log(`   🆔 ID: ${match.youtubeId}`);

                matchedIds.push(match.youtubeId);
                updatedVideos.push({
                    ...video,
                    youtubeId: match.youtubeId,
                    _matchScore: match.score,
                    _matchedTitle: match.title
                });
            } else {
                console.log(`   ⚠️  No good match found, keeping original ID`);
                warnings.push(video.title);
                updatedVideos.push(video);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            warnings.push(video.title);
            updatedVideos.push(video);
        }

        // Rate limiting delay between searches
        if (i < videos.length - 1) {
            await sleep(200);
        }
    }

    // Fetch statistics for matched videos
    console.log('\n📊 Fetching video statistics...');
    const stats = await fetchVideoStats(matchedIds);

    // Update videos with stats
    const finalVideos = updatedVideos.map(video => {
        const videoStats = stats[video.youtubeId];
        const { _matchScore, _matchedTitle, ...cleanVideo } = video;

        if (videoStats) {
            return {
                ...cleanVideo,
                viewCount: videoStats.viewCount,
                uploadDate: videoStats.uploadDate || cleanVideo.uploadDate
            };
        }

        return cleanVideo;
    });

    // Write updated file
    const outputData = {
        videos: finalVideos,
        settings
    };

    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(outputData, null, 2));

    // Summary
    console.log('\n════════════════════════════════════════');
    console.log('📝 Summary');
    console.log('════════════════════════════════════════');
    console.log(`   Total videos: ${videos.length}`);
    console.log(`   Matched: ${matchedIds.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    if (warnings.length > 0) {
        console.log('\n⚠️  Videos with no match found:');
        warnings.forEach(title => console.log(`   - ${title}`));
    }

    console.log(`\n✅ Updated: ${VIDEOS_FILE}`);
    console.log(`💾 Backup: ${BACKUP_FILE}`);
    console.log('\n🎬 Run "npm run dev" to verify the thumbnails match video titles.');
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});

import { describe, it, expect } from 'vitest'
import { buildYearData } from './ProductionPulse.jsx'
import { VIDEOS } from '../utils/videoData.js'

describe('buildYearData', () => {
  const yearData = buildYearData()

  it('returns an array of year entries', () => {
    expect(Array.isArray(yearData)).toBe(true)
    expect(yearData.length).toBeGreaterThan(0)
  })

  it('every entry has required fields: year, count, views, artistCount', () => {
    for (const d of yearData) {
      expect(d.year).toMatch(/^\d{4}$/)
      expect(typeof d.count).toBe('number')
      expect(d.count).toBeGreaterThan(0)
      expect(typeof d.views).toBe('number')
      expect(d.views).toBeGreaterThanOrEqual(0)
      expect(typeof d.artistCount).toBe('number')
      expect(d.artistCount).toBeGreaterThan(0)
    }
  })

  it('is sorted chronologically (earliest year first)', () => {
    for (let i = 1; i < yearData.length; i++) {
      expect(yearData[i].year > yearData[i - 1].year).toBe(true)
    }
  })

  it('total video count across all years matches VIDEOS count', () => {
    const videosWithDates = VIDEOS.filter(v => v.uploadDate?.slice(0, 4))
    const totalFromYears = yearData.reduce((sum, d) => sum + d.count, 0)
    expect(totalFromYears).toBe(videosWithDates.length)
  })

  it('total views across all years matches VIDEOS total views', () => {
    const videosWithDates = VIDEOS.filter(v => v.uploadDate?.slice(0, 4))
    const expectedViews = videosWithDates.reduce((sum, v) => sum + v.viewCount, 0)
    const actualViews = yearData.reduce((sum, d) => sum + d.views, 0)
    expect(actualViews).toBe(expectedViews)
  })

  it('artistCount per year is accurate against source data', () => {
    for (const d of yearData) {
      const videosInYear = VIDEOS.filter(v => v.uploadDate?.slice(0, 4) === d.year)
      const uniqueArtists = new Set(videosInYear.map(v => v.artist)).size
      expect(d.artistCount).toBe(uniqueArtists)
    }
  })

  it('does not leak the internal Set (artists field is undefined)', () => {
    for (const d of yearData) {
      expect(d.artists).toBeUndefined()
    }
  })

  it('year range covers the full catalog from earliest video to latest', () => {
    const years = yearData.map(d => d.year)
    // First year should match the earliest video in the catalog
    const earliestYear = VIDEOS
      .map(v => v.uploadDate?.slice(0, 4))
      .filter(Boolean)
      .sort()[0]
    expect(years[0]).toBe(earliestYear)
    // Last year should be recent
    expect(parseInt(years.at(-1))).toBeGreaterThanOrEqual(2024)
  })

  it('each year count is positive (no empty year buckets)', () => {
    for (const d of yearData) {
      expect(d.count).toBeGreaterThan(0)
    }
  })
})

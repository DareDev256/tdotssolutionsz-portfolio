import { useEffect, useRef } from 'react'

/* Free 15-minute intro call, booked live onto James's calendar.
 * The widget and its /api/slots + /api/book backend live on jamesdare.com (one backend for both sites);
 * this component only mounts it. Times are James's real free/busy across every calendar, and the
 * WhatsApp button stays beside it. If the calendar can't be read, the widget offers WhatsApp instead. */
const SRC = 'https://www.jamesdare.com/booking/widget.js'

export function IntroCall() {
  const host = useRef(null)
  useEffect(() => {
    if (document.querySelector(`script[src="${SRC}"]`)) return
    const s = document.createElement('script')
    s.src = SRC
    s.defer = true
    document.body.appendChild(s)
  }, [])
  return <div ref={host} id="intro-call" data-book-intro data-site="tdots" data-theme="dark" style={{ marginTop: 28 }} />
}

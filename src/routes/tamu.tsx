import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FALLBACK_GUEST_NAME } from '~/sections/CoverSection'

/**
 * Section 8 — internal tool, no page in `Asset Undangan Digital.pdf` (ANDEV-40).
 *
 * Lets the couple type a guest name once and get back the two things they'd otherwise
 * assemble by hand for every guest: the personalised `/?to=` invitation link (same
 * convention `CoverSection` reads, see its `FALLBACK_GUEST_NAME`/`clampGuestName`) and a
 * ready-to-paste WhatsApp message quoting this invitation's actual names, date, time and
 * venue — not the generic template in the issue's example. Not linked from the guest-facing
 * invitation flow; it's a tool for the couple, reached by visiting `/tamu` directly.
 */

type TamuSearch = {
  /** Optional seed so a link like `/tamu?to=Budi+Santoso` opens with the field pre-filled. */
  to?: string
}

export const Route = createFileRoute('/tamu')({
  validateSearch: (search: Record<string, unknown>): TamuSearch => {
    const to = typeof search.to === 'string' ? search.to.trim() : ''
    return to ? { to } : {}
  },
  head: () => ({
    meta: [
      { title: 'Generator Tamu — Aldi & Nahla' },
      {
        name: 'description',
        content: 'Buat link undangan dan template pesan WhatsApp untuk tiap tamu Aldi & Nahla.',
      },
    ],
  }),
  component: TamuGeneratorPage,
})

/** The couple's own facts, kept in one place so the message and the page copy never drift. */
const WEDDING = {
  bride: 'Nahla Karima',
  brideParents: 'Bapak Yakub & Ibu Halimah',
  groom: 'Aldi Ramadhan',
  groomParents: 'Bapak Nurdin & Ibu Endang',
  day: 'Sabtu, 5 September 2026',
  akad: '08.00 WIB (khusus keluarga terdekat)',
  resepsi: '13.00 – 15.00 WIB',
  venue: 'Kediaman Mempelai Wanita, Jl. Sawah Barat dlm II, RT.001/RW.06, Pondok Bambu, Duren Sawit',
} as const

/** Builds the personalised invitation link the same way `CoverSection` reads it back. */
function buildInvitationLink(origin: string, guestName: string): string {
  const params = new URLSearchParams({ to: guestName })
  return `${origin}/?${params.toString()}`
}

/** The WhatsApp message, adapted from the issue's example to this invitation's real content. */
function buildWhatsappMessage(guestName: string, link: string): string {
  const salutation = guestName.trim() ? `*${guestName.trim()}*` : `*${FALLBACK_GUEST_NAME}*`
  return `✨*Undangan Pernikahan Aldi & Nahla*✨

Assalamualaikum Warahmatullahi Wabarakatuh

Kepada Yth.
Bapak/Ibu/Saudara/i
${salutation}
─────────

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, teman sekaligus sahabat, untuk menghadiri acara pernikahan kami:

👰🏻‍♀️ *${WEDDING.bride.toUpperCase()}*
&
🤵🏻 *${WEDDING.groom.toUpperCase()}*

InsyaAllah akan dilaksanakan pada:
📆 ${WEDDING.day}
⏰ Akad ${WEDDING.akad}
⏰ Resepsi ${WEDDING.resepsi}
📍 ${WEDDING.venue}

*Berikut link undangan kami*, untuk info lengkap dari acara, bisa kunjungi:
${link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu. Terima kasih.

Wassalamualaikum Warahmatullahi Wabarakatuh

Hormat kami,
Aldi & Nahla
─────────`
}

type CopyState = 'idle' | 'copied' | 'error'

function useCopyToClipboard(): [CopyState, (text: string) => void] {
  const [state, setState] = useState<CopyState>('idle')

  const copy = (text: string) => {
    if (!text.trim()) return
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setState('error')
      return
    }
    navigator.clipboard
      .writeText(text)
      .then(() => setState('copied'))
      .catch(() => setState('error'))
    window.setTimeout(() => setState('idle'), 2000)
  }

  return [state, copy]
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, copy] = useCopyToClipboard()
  const disabled = !text.trim()

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => copy(text)}
      className="rounded-full border border-[color:var(--color-gold)] px-5 py-2 text-sm font-medium text-[color:var(--color-gold)] transition hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-green-900)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[color:var(--color-gold)]"
    >
      {state === 'copied' ? 'Tersalin ✓' : state === 'error' ? 'Gagal, salin manual' : label}
    </button>
  )
}

function TamuGeneratorPage() {
  const { to } = Route.useSearch()
  const [guestName, setGuestName] = useState(to ?? '')

  // `window` is undefined during SSR; the link/message still render with a relative-looking
  // placeholder origin until the client mounts and this recomputes.
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const invitationLink = useMemo(() => buildInvitationLink(origin, guestName.trim()), [origin, guestName])
  const whatsappMessage = useMemo(() => buildWhatsappMessage(guestName, invitationLink), [guestName, invitationLink])
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <main className="min-h-dvh bg-[color:var(--color-green-900)] px-6 py-16 text-[color:var(--color-cream)]">
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        <header className="flex flex-col gap-2 text-center">
          <p className="font-[var(--font-script)] text-4xl text-[color:var(--color-gold)]">Aldi & Nahla</p>
          <h1 className="text-2xl font-bold">Generator Link &amp; Pesan WhatsApp</h1>
          <p className="text-sm text-[color:var(--color-ornament)]">
            Ketik nama tamu untuk membuat link undangan pribadi dan template pesan WhatsApp yang tinggal
            disalin atau langsung dikirim.
          </p>
        </header>

        <section className="flex flex-col gap-2">
          <label htmlFor="guest-name" className="text-sm font-medium text-[color:var(--color-gold)]">
            Nama Tamu
          </label>
          <input
            id="guest-name"
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Contoh: Budi Santoso"
            autoComplete="off"
            className="rounded-lg border border-[color:var(--color-green-600)] bg-[color:var(--color-green-700)]/40 px-4 py-3 text-[color:var(--color-cream)] placeholder:text-[color:var(--color-cream)]/40 focus:border-[color:var(--color-gold)] focus:outline-none"
          />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[color:var(--color-green-600)] bg-[color:var(--color-green-700)]/30 p-5">
          <h2 className="text-sm font-medium text-[color:var(--color-gold)]">Link Undangan</h2>
          <p className="break-all font-mono text-sm text-[color:var(--color-cream)]">{invitationLink}</p>
          <div>
            <CopyButton text={invitationLink} label="Salin Link" />
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[color:var(--color-green-600)] bg-[color:var(--color-green-700)]/30 p-5">
          <h2 className="text-sm font-medium text-[color:var(--color-gold)]">Template Pesan WhatsApp</h2>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm text-[color:var(--color-cream)]">
            {whatsappMessage}
          </pre>
          <div className="flex flex-wrap gap-3">
            <CopyButton text={whatsappMessage} label="Salin Pesan" />
            <a
              href={guestName.trim() ? whatsappShareHref : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!guestName.trim()}
              className="rounded-full bg-[color:var(--color-gold)] px-5 py-2 text-sm font-medium text-[color:var(--color-green-900)] transition hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
            >
              Kirim via WhatsApp ↗
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

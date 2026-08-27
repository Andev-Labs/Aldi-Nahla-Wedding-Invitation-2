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
 *
 * The message is editable in place and the edit is saved to `localStorage`, so the couple
 * can settle on their own wording once and have it stick across reloads; "Reset Template
 * Message" drops the saved edit and goes back to the built-in default (ANDEV-42). "Kirim via
 * WhatsApp" also copies the message to the clipboard as a fallback for `wa.me`'s prefill, so
 * all that's left to do on the WhatsApp side is pick the number and send.
 *
 * The saved/edited text is the *template* — it holds `NAME_TOKEN`/`LINK_TOKEN` placeholders
 * rather than a guest's actual name and link baked in, and those get resolved fresh on every
 * render from the current "Nama Tamu" field and "Link Undangan" above. Baking the resolved
 * values in instead (this page's first cut) froze them the moment the couple edited the
 * wording, so the message quietly went stale — pointing at whatever guest was typed in at
 * edit time — while "Link Undangan" kept tracking the field; copy-pasting the two together
 * for a later guest then sent a mismatched link (reported against ANDEV-42, see comments).
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

/**
 * Placeholders the template is written against — swapped for the real guest name / invitation
 * link by `resolveWhatsappMessage` on every render, so editing the wording never disconnects
 * the message from whatever's currently in "Nama Tamu" / "Link Undangan".
 */
const NAME_TOKEN = '{{nama_tamu}}'
const LINK_TOKEN = '{{link_undangan}}'

/** The default template, adapted from the issue's example to this invitation's real content. */
function buildWhatsappTemplate(): string {
  return `✨*Undangan Pernikahan Aldi & Nahla*✨

Assalamualaikum Warahmatullahi Wabarakatuh

Kepada Yth.
Bapak/Ibu/Saudara/i
*${NAME_TOKEN}*
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
${LINK_TOKEN}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu. Terima kasih.

Wassalamualaikum Warahmatullahi Wabarakatuh

Hormat kami,
Aldi & Nahla
─────────`
}

/** The template as it ships, before any edit — also what "Reset Template Message" restores. */
const DEFAULT_WA_TEMPLATE = buildWhatsappTemplate()

/** Fills in `NAME_TOKEN`/`LINK_TOKEN` with this render's actual guest name and invitation link. */
function resolveWhatsappMessage(template: string, guestName: string, link: string): string {
  const salutation = guestName.trim() || FALLBACK_GUEST_NAME
  return template.split(NAME_TOKEN).join(salutation).split(LINK_TOKEN).join(link)
}

/**
 * Where the edited template is saved, so a reload doesn't lose the couple's wording. Versioned
 * because the pre-fix format baked a resolved name/link into the saved string instead of
 * tokens (see the module doc comment) — bumping the key drops any such stale saved value
 * rather than resolving its now-meaningless literal tokens.
 */
const WA_TEMPLATE_STORAGE_KEY = 'tamu-wa-template-v2'

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

  // Same `window` guard (and same accepted first-paint mismatch until the client mounts) as
  // `origin` above — no saved edit to read during SSR.
  const [template, setTemplate] = useState<string>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(WA_TEMPLATE_STORAGE_KEY)) || DEFAULT_WA_TEMPLATE,
  )
  const isCustomized = template !== DEFAULT_WA_TEMPLATE

  const whatsappMessage = useMemo(
    () => resolveWhatsappMessage(template, guestName, invitationLink),
    [template, guestName, invitationLink],
  )
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  const editTemplate = (value: string) => {
    setTemplate(value)
    window.localStorage.setItem(WA_TEMPLATE_STORAGE_KEY, value)
  }

  const resetTemplate = () => {
    setTemplate(DEFAULT_WA_TEMPLATE)
    window.localStorage.removeItem(WA_TEMPLATE_STORAGE_KEY)
  }

  // Best-effort clipboard copy alongside the `wa.me` `text=` prefill (which some WhatsApp
  // clients — desktop in particular — don't reliably honour), so the message is on the
  // clipboard either way and all that's left is picking the number and sending.
  const copyMessageForSend = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(whatsappMessage).catch(() => {})
  }

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[color:var(--color-gold)]">Template Pesan WhatsApp</h2>
            <button
              type="button"
              onClick={resetTemplate}
              disabled={!isCustomized}
              className="text-xs font-medium text-[color:var(--color-ornament)] underline decoration-dotted underline-offset-4 transition hover:text-[color:var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[color:var(--color-ornament)]"
            >
              Reset Template Message
            </button>
          </div>
          {/*
            Edits the raw template (with `{{nama_tamu}}` / `{{link_undangan}}` placeholders
            still in it), not the resolved `whatsappMessage` below — keeping those two tokens
            in the text is what keeps this in sync with "Nama Tamu" / "Link Undangan" above
            for every guest, not just whoever was typed in when it was last edited.
          */}
          <p className="text-xs text-[color:var(--color-ornament)]">
            Tulis <code className="font-mono">{NAME_TOKEN}</code> dan <code className="font-mono">{LINK_TOKEN}</code> di
            mana pun nama dan link tamu harus muncul — otomatis kesesuaikan dengan &quot;Nama Tamu&quot; dan
            &quot;Link Undangan&quot; di atas, walau template-nya sudah diubah.
          </p>
          <textarea
            value={template}
            onChange={(event) => editTemplate(event.target.value)}
            rows={14}
            className="max-h-96 min-h-52 resize-y whitespace-pre-wrap break-words rounded-lg border border-[color:var(--color-green-600)] bg-[color:var(--color-green-900)]/40 p-3 font-sans text-sm text-[color:var(--color-cream)] focus:border-[color:var(--color-gold)] focus:outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <CopyButton text={whatsappMessage} label="Salin Pesan" />
            <a
              href={guestName.trim() ? whatsappShareHref : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!guestName.trim()}
              onClick={() => guestName.trim() && copyMessageForSend()}
              className="rounded-full bg-[color:var(--color-gold)] px-5 py-2 text-sm font-medium text-[color:var(--color-green-900)] transition hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
            >
              Kirim via WhatsApp ↗
            </a>
          </div>
          {/*
            WhatsApp's own `text=` prefill is unreliable once the message has a link inside
            it — Web/Desktop routinely drop everything except the URL from the compose box
            (a known limitation of their click-to-chat API, not something this page controls).
            `copyMessageForSend` above already copies the full message before WhatsApp opens,
            so this just tells the couple to paste over whatever WhatsApp left behind.
          */}
          <p className="text-xs text-[color:var(--color-ornament)]">
            Pesan sudah otomatis tersalin. Kalau di WhatsApp yang muncul cuma link-nya doang, tinggal
            select all lalu paste (Cmd/Ctrl+V) di kolom chat-nya untuk pesan lengkapnya.
          </p>
        </section>
      </div>
    </main>
  )
}

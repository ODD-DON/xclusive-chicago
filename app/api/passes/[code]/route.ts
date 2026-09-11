import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { PKPass } from 'passkit-generator'
import { format, parseISO } from 'date-fns'
import fs from 'node:fs'
import path from 'node:path'

interface Props {
  params: Promise<{ code: string }>
}

// Generates a signed .pkpass on the fly from the access request -- nothing
// is pre-built or cached, so an approval that gets denied/changed later is
// reflected the next time the guest (re)adds it to Wallet.
export async function GET(request: NextRequest, { params }: Props) {
  const { code } = await params
  const supabase = createServiceClient()

  const { data: accessRequest, error } = await supabase
    .from('xc_access_requests')
    .select('*, member:xc_members(*), event:xc_events(*, club:xc_clubs(*))')
    .eq('app_id', APP_ID)
    .eq('access_code', code)
    .maybeSingle()

  if (error || !accessRequest || accessRequest.status !== 'approved') {
    return NextResponse.json({ error: 'This ticket is not available.' }, { status: 404 })
  }

  const signerCertB64 = process.env.APPLE_SIGNER_CERT_BASE64
  const signerKeyB64 = process.env.APPLE_SIGNER_KEY_BASE64
  const wwdrB64 = process.env.APPLE_WWDR_CERT_BASE64
  const signerKeyPassphrase = process.env.APPLE_SIGNER_KEY_PASSPHRASE
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER
  const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER

  if (!signerCertB64 || !signerKeyB64 || !wwdrB64 || !passTypeIdentifier || !teamIdentifier) {
    return NextResponse.json(
      { error: 'Apple Wallet is not configured yet. Ask an admin to finish the setup.' },
      { status: 501 },
    )
  }

  const event = accessRequest.event
  const club = event?.club
  const member = accessRequest.member
  if (!event || !club || !member) {
    return NextResponse.json({ error: 'This ticket is not available.' }, { status: 404 })
  }

  // Reused for every image slot -- not pixel-perfect per Apple's exact size
  // guidance, but a working, on-brand pass beats no pass while Apple Wallet
  // is first getting stood up.
  const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))

  const eventDate = parseISO(event.event_date)
  const guestName = `${member.first_name} ${member.last_name}`

  try {
    const pass = new PKPass(
      {
        'icon.png': logoBuffer,
        'icon@2x.png': logoBuffer,
        'logo.png': logoBuffer,
        'logo@2x.png': logoBuffer,
      },
      {
        wwdr: Buffer.from(wwdrB64, 'base64'),
        signerCert: Buffer.from(signerCertB64, 'base64'),
        signerKey: Buffer.from(signerKeyB64, 'base64'),
        signerKeyPassphrase,
      },
      {
        serialNumber: accessRequest.access_code,
        description: `${event.title} at ${club.name}`,
        organizationName: 'XCLUSIVE Chicago',
        passTypeIdentifier,
        teamIdentifier,
        backgroundColor: 'rgb(10,10,10)',
        foregroundColor: 'rgb(245,230,180)',
        labelColor: 'rgb(160,160,160)',
        logoText: 'XCLUSIVE',
      },
    )

    pass.type = 'eventTicket'
    pass.primaryFields.push({ key: 'event', label: 'EVENT', value: event.title })
    pass.secondaryFields.push(
      { key: 'venue', label: 'VENUE', value: club.name },
      { key: 'date', label: 'DATE', value: format(eventDate, 'EEE, MMM d') },
    )
    pass.auxiliaryFields.push(
      { key: 'guest', label: 'GUEST', value: guestName },
      { key: 'party', label: 'PARTY SIZE', value: String(accessRequest.guest_count) },
    )
    if (club.address) {
      pass.backFields.push({ key: 'address', label: 'ADDRESS', value: club.address })
    }
    pass.backFields.push({
      key: 'terms',
      label: 'NOTE',
      value: 'This ticket is non-transferable. Show it to staff at the door.',
    })

    pass.setBarcodes({
      message: `https://xclusivechicago.com/admin/checkin/${accessRequest.access_code}`,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: guestName,
    })

    if (club.lat && club.lng) {
      pass.setLocations({ latitude: club.lat, longitude: club.lng, relevantText: `You're near ${club.name}` })
    }

    const buffer = pass.getAsBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="xclusive-${accessRequest.access_code}.pkpass"`,
      },
    })
  } catch (err) {
    console.error('[wallet] Failed to generate pass:', err)
    return NextResponse.json({ error: 'Could not generate the wallet pass.' }, { status: 500 })
  }
}

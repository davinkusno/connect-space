import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST purchase badge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get badge details
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (badgeError || !badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      )
    }

    // Check if user already owns this badge
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', params.id)
      .single()

    if (existingBadge) {
      return NextResponse.json(
        { error: 'User already owns this badge' },
        { status: 400 }
      )
    }

    // Create user_badge record
    const { data: userBadge, error: purchaseError } = await supabase
      .from('user_badges')
      .insert([
        {
          user_id: userId,
          badge_id: params.id,
          purchased_at: new Date().toISOString(),
          purchase_price: badge.price,
        },
      ])
      .select()

    if (purchaseError) {
      return NextResponse.json(
        { error: purchaseError.message },
        { status: 400 }
      )
    }

    // Increment purchase_count
    await supabase
      .from('badges')
      .update({
        purchase_count: (badge.purchase_count || 0) + 1,
      })
      .eq('id', params.id)

    return NextResponse.json(
      {
        message: 'Badge purchased successfully',
        data: userBadge[0],
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

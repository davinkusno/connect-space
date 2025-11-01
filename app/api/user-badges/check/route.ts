import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST check if user owns badge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, badgeId } = body

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: 'User ID and Badge ID are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      owned: !!data,
      badge: data || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET check multiple badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const badgeIds = searchParams.getAll('badgeIds')

    if (!userId || badgeIds.length === 0) {
      return NextResponse.json(
        { error: 'User ID and Badge IDs are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .in('badge_id', badgeIds)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const ownedBadgeIds = data.map((item) => item.badge_id)

    return NextResponse.json({
      ownedBadgeIds,
      badgeOwnershipMap: badgeIds.reduce(
        (acc, id) => {
          acc[id] = ownedBadgeIds.includes(id)
          return acc
        },
        {} as Record<string, boolean>
      ),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

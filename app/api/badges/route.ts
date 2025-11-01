import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    let query = supabase
      .from('badges')
      .select('*')
      .order('created_at', { ascending: false })

    if (isActive === 'true') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create badge (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('badges')
      .insert([
        {
          name: body.name,
          description: body.description,
          icon: body.icon || 'Star',
          category: body.category || 'achievement',
          price: body.price,
          image_url: body.image_url || null,
          is_active: body.is_active ?? true,
          purchase_count: 0,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('Insert response:', data)

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve inserted badge. Check RLS policies.' },
        { status: 400 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

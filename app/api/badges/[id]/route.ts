import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET single badge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
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

// PUT update badge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('badges')
      .update({
        name: body.name,
        description: body.description,
        icon: body.icon,
        category: body.category,
        price: body.price,
        image_url: body.image_url,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE badge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First get the badge to get image_url
    const { data: badge, error: fetchError } = await supabase
      .from('badges')
      .select('image_url')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      )
    }

    // Delete image from storage if exists
    if (badge?.image_url) {
      const pathMatch = badge.image_url.match(/badges\/.+/)
      if (pathMatch) {
        await supabase.storage
          .from('ConnectSpace')
          .remove([pathMatch[0]])
      }
    }

    // Delete badge from database
    const { error: deleteError } = await supabase
      .from('badges')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Badge deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

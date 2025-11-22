# Super Admin Reports Integration Guide

## 📊 Struktur Database untuk Community Reports

### 1. Tabel `community_reports`

```sql
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason VARCHAR(100) NOT NULL, -- 'spam', 'hate_speech', 'misinformation', 'scam', 'inappropriate_content', 'copyright_violation'
  description TEXT, -- OPTIONAL: Notes/alasan detail dari user
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes untuk performance
CREATE INDEX idx_community_reports_community ON community_reports(community_id);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_created ON community_reports(created_at DESC);
```

### 2. Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
ON community_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON community_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reported_by);

-- Policy: Super admins can view all reports
CREATE POLICY "Super admins can view all reports"
ON community_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy: Super admins can update reports
CREATE POLICY "Super admins can update reports"
ON community_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
```

## 🔧 API Endpoints

### 1. Endpoint untuk User Report Community

**File**: `/app/api/communities/[id]/report/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, description } = body; // description is OPTIONAL

    // Validate reason
    const validReasons = [
      'spam',
      'hate_speech',
      'misinformation',
      'scam',
      'inappropriate_content',
      'copyright_violation'
    ];

    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      );
    }

    // Check if user already reported this community
    const { data: existingReport } = await supabase
      .from('community_reports')
      .select('id')
      .eq('community_id', params.id)
      .eq('reported_by', user.id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this community' },
        { status: 400 }
      );
    }

    // Create report
    const { data: report, error } = await supabase
      .from('community_reports')
      .insert({
        community_id: params.id,
        reported_by: user.id,
        reason,
        description: description || null, // Optional field
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
```

### 2. Endpoint untuk Super Admin Get Reports

**File**: `/app/api/superadmin/reports/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Verify super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all reports with community and user details
    const { data: reports, error } = await supabase
      .from('community_reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        community:communities(
          id,
          name,
          category,
          member_count,
          created_at,
          creator:profiles(
            id,
            full_name,
            email
          )
        ),
        reporter:profiles(
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group reports by community
    const groupedReports = reports.reduce((acc: any, report: any) => {
      const communityId = report.community.id;
      
      if (!acc[communityId]) {
        acc[communityId] = {
          id: `rep-${communityId}`,
          communityId: communityId,
          communityName: report.community.name,
          category: report.community.category,
          reportCount: 0,
          lastReportDate: report.created_at,
          status: 'pending',
          reports: [],
          communityDetails: {
            memberCount: report.community.member_count,
            createdAt: report.community.created_at,
            lastActivity: report.created_at,
            admin: {
              name: report.community.creator.full_name,
              email: report.community.creator.email,
            }
          }
        };
      }

      acc[communityId].reportCount++;
      acc[communityId].reports.push({
        reportedBy: report.reporter.id,
        reporterName: report.reporter.full_name,
        reason: report.reason,
        description: report.description, // This is the user's notes
        reportDate: report.created_at,
      });

      return acc;
    }, {});

    return NextResponse.json({
      reportedCommunities: Object.values(groupedReports)
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
```

## 🎨 Frontend Component untuk Report Modal

### Component untuk User Report Community

**File**: `/components/community/report-modal.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

export function ReportModal({
  isOpen,
  onClose,
  communityId,
  communityName,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState(''); // Optional notes
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or unwanted content' },
    { value: 'hate_speech', label: 'Hate speech or harassment' },
    { value: 'misinformation', label: 'False information' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'copyright_violation', label: 'Copyright violation' },
  ];

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          description: description.trim() || null, // Optional
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      alert('Report submitted successfully. Thank you for helping keep our community safe.');
      onClose();
      
      // Reset form
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Report Community
          </DialogTitle>
          <DialogDescription>
            Report "{communityName}" for violating community guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason Selection */}
          <div>
            <Label className="mb-3 block">
              Reason for reporting <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Description/Notes */}
          <div>
            <Label htmlFor="description" className="mb-2 block">
              Additional details <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide any additional information that might help us understand the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {description.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 📝 Summary

### Yang Sudah Diimplementasikan di Super Admin:

1. ✅ **Mock Data** dengan field `description` untuk notes user
2. ✅ **Report Detail Dialog** menampilkan user notes dengan jelas
3. ✅ **Indikator Icon** 💬 di tabel untuk menunjukkan report yang memiliki notes
4. ✅ **Conditional Rendering** - menampilkan "No additional notes provided" jika tidak ada notes
5. ✅ **Styling** yang jelas dengan label "User Notes" dan icon MessageSquare

### Yang Perlu Diimplementasikan:

1. **Database Schema** - Buat tabel `community_reports` dengan field `description`
2. **API Endpoint** - Buat endpoint untuk user report community
3. **Report Modal** - Buat modal untuk user submit report dengan optional notes
4. **Fetch Real Data** - Replace mock data dengan data dari Supabase

### Field `description` adalah OPTIONAL karena:
- User mungkin hanya memilih reason tanpa detail tambahan
- Reason kategori sudah cukup untuk beberapa kasus
- Membuat UX lebih fleksibel - user bisa quick report

### Flow Lengkap:

1. **User Report** → Pilih reason (required) + isi notes (optional)
2. **Tersimpan di DB** → Field `description` bisa NULL
3. **Super Admin Lihat** → Report muncul di tabel dengan icon 💬 jika ada notes
4. **Super Admin View Detail** → Notes ditampilkan lengkap dengan label jelas
5. **Super Admin Action** → Suspend/Dismiss berdasarkan review


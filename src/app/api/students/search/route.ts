import { NextResponse } from 'next/server';
import { queryMart } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, students: [] });
  }

  try {
    const searchPattern = `%${q}%`;
    const res = await queryMart(`
      SELECT 
        s.id, 
        s.admission_no, 
        s.first_name, 
        s.last_name, 
        TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as student_name,
        COALESCE(c.grade, 'Standard') as grade, 
        COALESCE(c.section, 'A') as section,
        s.father_name
      FROM public.students s
      LEFT JOIN public.classes c ON s.class_id = c.id
      WHERE 
        s.admission_no ILIKE $1 
        OR s.first_name ILIKE $1 
        OR s.last_name ILIKE $1 
        OR (s.first_name || ' ' || COALESCE(s.last_name, '')) ILIKE $1
      ORDER BY s.admission_no ASC
      LIMIT 10;
    `, [searchPattern]);

    const formatted = (res.rows || []).map((row: any) => ({
      id: row.id,
      admissionNo: row.admission_no || '',
      name: row.student_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      grade: row.grade ? `${row.grade} (${row.section})` : 'Class 1',
      fatherName: row.father_name || ''
    }));

    return NextResponse.json({ success: true, students: formatted });
  } catch (err: any) {
    console.error('[Student Search Error]:', err);
    return NextResponse.json({ success: false, error: err.message, students: [] });
  }
}

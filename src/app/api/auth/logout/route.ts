import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('mart_token');
  response.cookies.delete('mart_user_role');
  response.cookies.delete('mart_user_name');
  response.cookies.delete('mart_branch_id');
  return response;
}

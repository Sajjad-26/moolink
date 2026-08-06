import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { username } = await params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('username', username)
    .single();

  const name = profile?.display_name || username;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFAF2',
        }}
      >
        {/* Subtle irregular patches in corners */}
        <div
          style={{
            position: 'absolute', top: -80, left: -30,
            width: 300, height: 250,
            backgroundColor: '#2D2A26',
            borderRadius: '40% 60% 50% 50% / 50% 40% 60% 50%',
            opacity: 0.04,
            transform: 'rotate(-15deg)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -100, right: -40,
            width: 350, height: 280,
            backgroundColor: '#2D2A26',
            borderRadius: '55% 45% 60% 40% / 40% 60% 45% 55%',
            opacity: 0.04,
            transform: 'rotate(10deg)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 100, right: 200,
            width: 120, height: 80,
            backgroundColor: '#2D2A26',
            borderRadius: '45% 55% 50% 50% / 50% 50% 40% 60%',
            opacity: 0.03,
            transform: 'rotate(-25deg)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: 150, left: 200,
            width: 140, height: 100,
            backgroundColor: '#2D2A26',
            borderRadius: '50% 50% 55% 45% / 60% 40% 50% 50%',
            opacity: 0.03,
            transform: 'rotate(20deg)',
          }}
        />

        <div style={{ display: 'flex', fontSize: 80 }}>🐮</div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 800,
            color: '#2D2A26',
            marginTop: 12,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            color: '#8B7355',
            marginTop: 8,
          }}
        >
          {new URL(request.url).host}/{username}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
